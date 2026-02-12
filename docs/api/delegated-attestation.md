---
id: delegated-attestation
title: Delegated Attestation API
sidebar_position: 2
---

# Delegated Attestation API

The Delegated Attestation API enables gas-subsidized attestations on EAS. The attester signs an EIP-712 typed message in their wallet, then the server submits the transaction on their behalf, paying gas from a server-side delegate wallet.

This lets users create attestations without holding native tokens for gas.

## How It Works

1. The client fetches the attester's current EAS nonce via `GET /api/eas/nonce`
2. The client builds an EIP-712 typed data structure and prompts the user to sign it
3. The client sends the signed data to `POST /api/eas/delegated-attest`
4. The server verifies the signature, checks schema eligibility, and submits the transaction via `attestByDelegation` on the EAS contract
5. The server returns the attestation UID and transaction hash

## Endpoints

### GET /api/eas/nonce

Returns the current EAS nonce for a given attester address. The nonce is required to build the EIP-712 typed data for signing.

#### Request

| Parameter | Location | Type | Required | Description |
|---|---|---|---|---|
| `attester` | query | string | Yes | Ethereum address (0x-prefixed, 20 bytes) |

#### Example Request

```bash
curl "https://reputation.omatrust.org/api/eas/nonce?attester=0x1234567890abcdef1234567890abcdef12345678"
```

#### Response (Success)

```json
{
  "nonce": "0",
  "chain": "OMAchain Testnet",
  "chainId": 66238,
  "easAddress": "0x7946127D2f517c8584FdBF801b82F54436EC6FC7",
  "elapsed": "120ms"
}
```

| Field | Type | Description |
|---|---|---|
| `nonce` | string | Current EAS nonce for the attester (stringified integer) |
| `chain` | string | Human-readable chain name |
| `chainId` | number | Chain ID |
| `easAddress` | string | EAS contract address on this chain |
| `elapsed` | string | Request duration |

#### Errors

| HTTP Status | Description |
|---|---|
| 400 | Missing or invalid `attester` parameter |
| 500 | EAS not configured or RPC failure |

---

### POST /api/eas/delegated-attest

Submits a signed delegated attestation to EAS. The server pays gas on behalf of the attester.

#### Request

| Field | Type | Required | Description |
|---|---|---|---|
| `attester` | string | Yes | Ethereum address of the signer (0x-prefixed, 20 bytes) |
| `signature` | string | Yes | EIP-712 signature from the attester's wallet |
| `delegated` | object | Yes | The attestation data that was signed (see below) |

##### `delegated` object

| Field | Type | Description |
|---|---|---|
| `schema` | string | Schema UID (0x-prefixed, 32 bytes) |
| `recipient` | string | Attestation recipient address (0x-prefixed, 20 bytes) |
| `expirationTime` | number | Unix timestamp for expiration (`0` for no expiration) |
| `revocable` | boolean | Whether the attestation can be revoked |
| `refUID` | string | Referenced attestation UID (`0x000...000` for none) |
| `data` | string | ABI-encoded attestation data (0x-prefixed) |
| `deadline` | number | Unix timestamp after which the signature is invalid |

#### Example Request

```bash
curl -X POST https://reputation.omatrust.org/api/eas/delegated-attest \
  -H "Content-Type: application/json" \
  -d '{
    "attester": "0x1234567890abcdef1234567890abcdef12345678",
    "signature": "0xabc123...signature...",
    "delegated": {
      "schema": "0x807b38ce9aa23fdde4457de01db9c5e8d6ec7c8feebee242e52be70847b7b966",
      "recipient": "0x0000000000000000000000000000000000000000",
      "expirationTime": 0,
      "revocable": true,
      "refUID": "0x0000000000000000000000000000000000000000000000000000000000000000",
      "data": "0x...",
      "deadline": 1739000000
    }
  }'
```

#### Response (Success)

```json
{
  "success": true,
  "txHash": "0x...",
  "uid": "0x...",
  "blockNumber": 12345,
  "chain": "OMAchain Testnet",
  "elapsed": "3200ms"
}
```

| Field | Type | Description |
|---|---|---|
| `success` | boolean | `true` |
| `txHash` | string | Transaction hash |
| `uid` | string \| null | EAS attestation UID (parsed from the `Attested` event log) |
| `blockNumber` | number | Block number where the transaction was confirmed |
| `chain` | string | Human-readable chain name |
| `elapsed` | string | Request duration |

#### Error Codes

| HTTP Status | Code | Description |
|---|---|---|
| 400 | — | Missing required fields (`delegated`, `signature`, `attester`) |
| 400 | `SIGNATURE_EXPIRED` | The `deadline` has passed |
| 400 | `INVALID_SIGNATURE` | Signature format is invalid or cannot be verified |
| 400 | `ATTESTER_MISMATCH` | Recovered signer does not match the `attester` field |
| 403 | `SCHEMA_NOT_SUBSIDIZED` | Schema is not eligible for gas subsidy |
| 409 | `DUPLICATE` | This exact signature was already submitted (replay protection) |
| 500 | `NO_DELEGATE_KEY` | Server-side delegate wallet key is not configured |
| 500 | — | RPC failure, gas estimation failure, or transaction revert |
| 501 | `MAINNET_NOT_SUPPORTED` | Mainnet delegated attestations are not yet enabled |

## EIP-712 Typed Data

The attester signs an EIP-712 message with the following structure:

### Domain

| Field | Value |
|---|---|
| `name` | `EAS` |
| `version` | `1.0.0` |
| `chainId` | Target chain ID (e.g., `66238`) |
| `verifyingContract` | EAS contract address |

### Types

```
Attest(
  address attester,
  bytes32 schema,
  address recipient,
  uint64 expirationTime,
  bool revocable,
  bytes32 refUID,
  bytes data,
  uint256 value,
  uint256 nonce,
  uint64 deadline
)
```

The `nonce` is fetched from the EAS contract via the nonce endpoint. The `value` is always `0` (no ETH attached).

## Schema Eligibility

Only schemas on the subsidized allowlist are eligible for gas-subsidized delegated attestation. Submitting a non-subsidized schema returns `403 SCHEMA_NOT_SUBSIDIZED`.

The active chain is determined by the `NEXT_PUBLIC_ACTIVE_CHAIN` environment variable on the server (`omachain-testnet` or `omachain-mainnet`).

## Typical Integration Flow

```
┌──────────┐     ┌──────────────┐     ┌─────┐
│  Client   │     │  Reputation  │     │ EAS │
│ (browser) │     │   Server     │     │     │
└─────┬─────┘     └──────┬───────┘     └──┬──┘
      │                  │                │
      │ GET /api/eas/    │                │
      │ nonce?attester=  │                │
      │─────────────────>│                │
      │                  │  getNonce()    │
      │                  │───────────────>│
      │                  │<───────────────│
      │  { nonce }       │                │
      │<─────────────────│                │
      │                  │                │
      │ (build EIP-712   │                │
      │  typed data,     │                │
      │  prompt wallet   │                │
      │  signature)      │                │
      │                  │                │
      │ POST /api/eas/   │                │
      │ delegated-attest │                │
      │─────────────────>│                │
      │                  │ verify sig     │
      │                  │ check schema   │
      │                  │                │
      │                  │ attestByDelegation()
      │                  │───────────────>│
      │                  │<───────────────│
      │                  │                │
      │ { uid, txHash }  │                │
      │<─────────────────│                │
```

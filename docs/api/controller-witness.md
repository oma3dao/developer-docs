---
id: controller-witness
title: Controller Witness API
sidebar_position: 1
---

# Controller Witness API

The Controller Witness API creates an immutable on-chain record that a trusted witness observed a controller assertion at a specific point in time. This solves the **mutable evidence problem**: when a subject removes or changes their DNS TXT or `did.json`, verifiers can no longer confirm that a key was authorized at the time of a Key Binding attestation. The witness attestation preserves that proof permanently.

## How It Works

1. A subject creates a **Key Binding** attestation binding a key (e.g., `did:pkh` wallet) to their `did:web` identity
2. The subject publishes controller evidence in their DNS TXT record or `/.well-known/did.json`
3. Any client calls the Controller Witness API with the Key Binding UID
4. The witness server verifies the Key Binding on-chain, checks the offchain evidence, and submits a **Controller Witness** attestation to EAS

The result is an immutable timestamp: "At time T, the witness observed that `did:web:example.com` asserted `did:pkh:eip155:66238:0x...` as its controller."

## Endpoint

```
POST https://api.omatrust.org/v1/controller-witness
```

No API key required. The on-chain prerequisite (a valid Key Binding on an approved schema/chain) serves as the anti-abuse mechanism.

## Request

| Field | Type | Required | Description |
|---|---|---|---|
| `attestationUid` | string | Yes | EAS attestation UID of the Key Binding attestation (0x-prefixed, 32 bytes) |
| `chainId` | number | Yes | Chain ID where the Key Binding lives (e.g., `66238` for OMAchain testnet) |
| `easContract` | string | Yes | EAS contract address on that chain (0x-prefixed, 20 bytes) |
| `schemaUid` | string | Yes | Schema UID of the Key Binding attestation (0x-prefixed, 32 bytes) |
| `subject` | string | Yes | Subject DID (e.g., `did:web:example.com`) — must match the Key Binding |
| `controller` | string | Yes | Controller DID (e.g., `did:pkh:eip155:66238:0x...`) — must match the Key Binding |
| `method` | string | Yes | Evidence verification method: `dns-txt` or `did-json` |

### Example Request

```bash
curl -X POST https://api.omatrust.org/v1/controller-witness \
  -H "Content-Type: application/json" \
  -d '{
    "attestationUid": "0xabc123...def456",
    "chainId": 66238,
    "easContract": "0x7946127D2f517c8584FdBF801b82F54436EC6FC7",
    "schemaUid": "0x807b38ce9aa23fdde4457de01db9c5e8d6ec7c8feebee242e52be70847b7b966",
    "subject": "did:web:example.com",
    "controller": "did:pkh:eip155:66238:0x1234567890abcdef1234567890abcdef12345678",
    "method": "dns-txt"
  }'
```

## Response (Success)

```json
{
  "success": true,
  "uid": "0x...",
  "txHash": "0x...",
  "blockNumber": 12345,
  "observedAt": 1738972800,
  "existing": false,
  "elapsed": "1234ms"
}
```

| Field | Type | Description |
|---|---|---|
| `success` | boolean | `true` |
| `uid` | string | EAS attestation UID of the new (or existing) Controller Witness attestation |
| `txHash` | string \| null | Transaction hash (`null` if returning an existing attestation) |
| `blockNumber` | number \| null | Block number (`null` if returning an existing attestation) |
| `observedAt` | number | Unix timestamp when the witness observed the controller assertion |
| `existing` | boolean | `true` if a duplicate was found and the existing UID was returned |
| `elapsed` | string | Request duration |

## Error Codes

| HTTP Status | Code | Description |
|---|---|---|
| 400 | `MISSING_FIELDS` | Required fields missing or malformed |
| 400 | `INVALID_SUBJECT` | Subject is not a valid DID |
| 400 | `INVALID_CONTROLLER` | Controller is not a valid DID |
| 400 | `INVALID_METHOD` | Method is not `dns-txt` or `did-json` |
| 403 | `CHAIN_NOT_APPROVED` | Chain ID or EAS contract not in the approved list |
| 403 | `SCHEMA_NOT_APPROVED` | Schema UID is not a witness-enabled schema |
| 404 | `ATTESTATION_NOT_FOUND` | The `attestationUid` does not resolve to an attestation on-chain |
| 404 | `EVIDENCE_NOT_FOUND` | Controller evidence not found via the specified method |
| 409 | `ATTESTATION_REVOKED` | The Key Binding attestation has been revoked |
| 422 | `FIELDS_MISMATCH` | Subject or controller in the request doesn't match the on-chain attestation |
| 500 | `SERVER_ERROR` | Internal error (key not configured, EAS submission failed, etc.) |

## Evidence Methods

### dns-txt

The witness queries `_omatrust.<domain>` for DNS TXT records containing a controller assertion in the OMATrust evidence string format:

```
v=1;controller=did:pkh:eip155:66238:0x1234567890abcdef1234567890abcdef12345678
```

The subject must be a `did:web` so the domain can be extracted. The controller value must be a DID (e.g., `did:pkh:eip155:<chainId>:<address>`). The witness compares the address portion of the controller DID against the expected controller, so the same address on different chains will match.

### did-json

The witness fetches `https://<domain>/.well-known/did.json` and looks for the controller address in `verificationMethod` entries. Specifically, it checks `blockchainAccountId` fields in the DID document for an address match.

## Prerequisites

Before calling this API, the caller must have:

1. **A Key Binding attestation on-chain** — created via the OMATrust attestation frontend or directly through EAS. The Key Binding must be on an approved chain and schema.

2. **Controller evidence published** — either a DNS TXT record at `_omatrust.<domain>` or a `did.json` at `/.well-known/did.json` containing the controller DID.

### Setting Up DNS TXT Evidence

Add a TXT record to your domain:

| Record | Type | Value |
|---|---|---|
| `_omatrust.example.com` | TXT | `v=1;controller=did:pkh:eip155:66238:0xYourAddress` |

### Setting Up did.json Evidence

Publish a DID document at `https://example.com/.well-known/did.json`:

```json
{
  "@context": ["https://www.w3.org/ns/did/v1"],
  "id": "did:web:example.com",
  "verificationMethod": [{
    "id": "did:web:example.com#key-1",
    "type": "EcdsaSecp256k1RecoveryMethod2020",
    "controller": "did:web:example.com",
    "blockchainAccountId": "eip155:66238:0xYourAddress"
  }]
}
```

## Approved Chains and Schemas

The witness server only accepts attestations from approved chains and schemas.

### Chains

| Chain | Chain ID | EAS Contract |
|---|---|---|
| OMAchain Testnet | 66238 | `0x7946127D2f517c8584FdBF801b82F54436EC6FC7` |

### Schemas

| Schema | UID (OMAchain Testnet) |
|---|---|
| Key Binding | `0x807b38ce9aa23fdde4457de01db9c5e8d6ec7c8feebee242e52be70847b7b966` |

## Controller Witness Schema

The attestation created by the witness uses the following EAS schema:

```
string subject, string controller, string method, uint256 observedAt
```

| Field | Type | Description |
|---|---|---|
| `subject` | string | The `did:web` identity of the entity authorizing the controller |
| `controller` | string | The controller DID (e.g., `did:pkh:eip155:66238:0x...`) |
| `method` | string | How the witness observed the assertion (`dns-txt` or `did-json`) |
| `observedAt` | uint256 | Unix timestamp when the witness observed the controller assertion |

Schema UID on OMAchain Testnet: `0xc81419f828755c0be2c49091dcad0887b5ca7342316dfffb4314aadbf8205090`

The schema is non-revocable. Once a witness attestation is created, it permanently records what was observed at that point in time.

## Typical Integration Flow

```
┌─────────┐     ┌──────────┐     ┌─────────────┐     ┌─────┐
│  Client  │     │ Witness  │     │  DNS / Web  │     │ EAS │
│          │     │  Server  │     │   Server    │     │     │
└────┬─────┘     └────┬─────┘     └──────┬──────┘     └──┬──┘
     │                │                   │               │
     │  POST /api/    │                   │               │
     │  controller-   │                   │               │
     │  witness       │                   │               │
     │───────────────>│                   │               │
     │                │                   │               │
     │                │  getAttestation() │               │
     │                │──────────────────────────────────>│
     │                │<──────────────────────────────────│
     │                │  (verify gates)   │               │
     │                │                   │               │
     │                │  DNS TXT query /  │               │
     │                │  fetch did.json   │               │
     │                │──────────────────>│               │
     │                │<──────────────────│               │
     │                │  (verify match)   │               │
     │                │                   │               │
     │                │  eas.attest()     │               │
     │                │──────────────────────────────────>│
     │                │<──────────────────────────────────│
     │                │                   │               │
     │  { uid, txHash,│                   │               │
     │    observedAt } │                   │               │
     │<───────────────│                   │               │
```

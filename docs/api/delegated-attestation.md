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

## Typical Implementation

The `@oma3/omatrust` SDK handles encoding, typed-data construction, recipient derivation, and relay submission. This is the simplest integration path.

```ts
import {
  prepareDelegatedAttestation,
  submitDelegatedAttestation,
} from "@oma3/omatrust/reputation";

// 1. Fetch the attester's current EAS nonce
const nonceRes = await fetch(
  `https://reputation.omatrust.org/api/eas/nonce?attester=${walletAddress}`
);
const { nonce, easAddress, chainId } = await nonceRes.json();

// 2. Prepare the EIP-712 typed data
//    The SDK encodes attestation data, resolves the recipient address
//    from the subject DID, and auto-computes subjectDidHash when the
//    schema includes that field.
const prepared = await prepareDelegatedAttestation({
  chainId,
  easContractAddress: easAddress,
  schemaUid: "0x7ab3...2a47",                       // deployed schema UID
  schema: "string subject, string version, uint256 ratingValue, " +
          "string reviewBody, string[] screenshotUrls, string[] proofs",
  data: {
    subject: "did:web:mygame.com",
    version: "",
    ratingValue: 4,
    reviewBody: "Great game",
    screenshotUrls: [],
    proofs: [],
  },
  attester: walletAddress,
  nonce: BigInt(nonce),
  revocable: false,                                  // match the schema's setting
});

// 3. Sign the EIP-712 payload
//    This produces the 65-byte EIP-712 signature that the server will verify.
const signature = await signer.signTypedData(
  prepared.typedData.domain,
  prepared.typedData.types,
  prepared.typedData.message,
);

// 4. Submit to the relay
const result = await submitDelegatedAttestation({
  relayUrl: "https://reputation.omatrust.org/api/eas/delegated-attest",
  prepared,
  signature,
  attester: walletAddress,
});

console.log(result.uid, result.txHash);
```

That's it. The SDK serializes `BigInt` values automatically and posts `{ prepared, signature, attester }` to the relay.

## Endpoints

### GET /api/eas/nonce

Returns the current EAS nonce for a given attester address. The nonce is required to build the EIP-712 typed data for signing.

#### Request

| Parameter | Location | Type     | Required | Description                              |
|-----------|----------|----------|----------|------------------------------------------|
| `attester`| query    | string   | Yes      | Ethereum address (0x-prefixed, 20 bytes) |

#### Response

```json
{
  "nonce": "0",
  "chain": "OMAchain Testnet",
  "chainId": 66238,
  "easAddress": "0x7946127D2f517c8584FdBF801b82F54436EC6FC7",
  "elapsed": "120ms"
}
```

| Field        | Type   | Description                                          |
|--------------|--------|------------------------------------------------------|
| `nonce`      | string | Current EAS nonce for the attester (stringified int)  |
| `chain`      | string | Human-readable chain name                            |
| `chainId`    | number | Chain ID                                             |
| `easAddress` | string | EAS contract address on this chain                   |
| `elapsed`    | string | Request duration                                     |

#### Errors

| HTTP Status | Description                              |
|-------------|------------------------------------------|
| 400         | Missing or invalid `attester` parameter  |
| 500         | EAS not configured or RPC failure        |

---

### POST /api/eas/delegated-attest

Submits a signed delegated attestation to EAS. The server pays gas on behalf of the attester.

#### Request Body

| Field       | Type   | Required | Description |
|-------------|--------|----------|-------------|
| `attester`  | string | Yes      | Ethereum address of the signer (0x-prefixed, 20 bytes) |
| `signature` | string | Yes      | 65-byte EIP-712 signature produced by signing `prepared.typedData` |
| `prepared`  | object | Yes      | The return value of `prepareDelegatedAttestation()` (see below) |

##### `prepared` object

| Field              | Type   | Description |
|--------------------|--------|-------------|
| `delegatedRequest` | object | Contains `schema` (bytes32), `attester` (address), `easContractAddress`, `chainId`, and the EIP-712 message fields |
| `typedData`        | object | The full EIP-712 typed data (`domain`, `types`, `message`) used for server-side signature verification |

The server extracts the schema UID, deadline, and attestation data from `prepared.delegatedRequest` and `prepared.typedData.message`. It independently rebuilds the EIP-712 typed data using the server-fetched nonce (not the client's) to verify the signature.

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

| Field         | Type           | Description |
|---------------|----------------|-------------|
| `success`     | boolean        | `true` |
| `txHash`      | string         | Transaction hash |
| `uid`         | string \| null | EAS attestation UID (parsed from the `Attested` event log) |
| `blockNumber` | number         | Block number where the transaction was confirmed |
| `chain`       | string         | Human-readable chain name |
| `elapsed`     | string         | Request duration |

#### Error Codes

| HTTP Status | Code                    | Description |
|-------------|-------------------------|-------------|
| 400         | —                       | Missing required fields (`prepared`, `signature`, `attester`) |
| 400         | `SIGNATURE_EXPIRED`     | The `deadline` has passed |
| 400         | `INVALID_SIGNATURE`     | Signature format is invalid or cannot be verified |
| 400         | `ATTESTER_MISMATCH`     | Recovered signer does not match the `attester` field |
| 403         | `SCHEMA_NOT_SUBSIDIZED` | Schema is not on the subsidized allowlist |
| 409         | `DUPLICATE`             | This exact signature was already submitted (replay protection) |
| 500         | `NO_DELEGATE_KEY`       | Server-side delegate wallet is not configured |
| 500         | —                       | RPC failure, gas estimation failure, or transaction revert |
| 501         | `MAINNET_NOT_SUPPORTED` | Mainnet delegated attestations are not yet enabled |

## Schema Eligibility

Only schemas on the subsidized allowlist can use the delegated attestation API. Submitting a non-subsidized schema returns `403 SCHEMA_NOT_SUBSIDIZED`. Non-subsidized schemas must be submitted directly by the attester, who pays gas.

Currently subsidized schemas (OMAchain Testnet):

| Schema | UID |
|--------|-----|
| User Review | `0x7ab3911527e5e47eaab9f5a2c571060026532dde8cb4398185553053963b2a47` |
| Linked Identifier | `0x26e21911c55587925afee4b17839ab091e9829321b4a4e1658c497eb0088b453` |

The active chain is determined by the `NEXT_PUBLIC_ACTIVE_CHAIN` environment variable on the server (`omachain-testnet` or `omachain-mainnet`).

## Integration Flow

```
┌───────────┐     ┌──────────────┐     ┌─────┐
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
      │  { nonce,        │                │
      │    chainId,      │                │
      │    easAddress }  │                │
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


## Reference: Manual Integration (Without SDK)

This section is for developers who cannot use the `@oma3/omatrust` SDK and need to construct the EIP-712 payload, encode attestation data, and derive the recipient address manually.

### Creating The Delegated Attestation Signature

The attester signs an EIP-712 message with the following structure. The server independently rebuilds this typed data from the submitted fields and the server-fetched nonce, then verifies the signature against it.

#### Domain

| Field               | Type    | Value |
|---------------------|---------|-------|
| `name`              | string  | `"EAS"` |
| `version`           | string  | `"1.4.0"` |
| `chainId`           | uint256 | Target chain ID (e.g., `66238` for OMAchain Testnet) |
| `verifyingContract`  | address | EAS contract address (returned by the nonce endpoint) |

#### Types

```solidity
Attest(
  address attester,
  bytes32 schema,
  address recipient,
  uint64  expirationTime,
  bool    revocable,
  bytes32 refUID,
  bytes   data,
  uint256 value,
  uint256 nonce,
  uint64  deadline
)
```

#### Message Fields

| Field            | Type    | Description |
|------------------|---------|-------------|
| `attester`       | address | The wallet address signing the attestation |
| `schema`         | bytes32 | Schema UID for the attestation type |
| `recipient`      | address | Recipient address (see [Recipient Address Derivation](#recipient-address-derivation) below) |
| `expirationTime` | uint64  | Unix timestamp for expiration (`0` for no expiration) |
| `revocable`      | bool    | Whether the attestation can be revoked |
| `refUID`         | bytes32 | Referenced attestation UID (`0x000...000` for none) |
| `data`           | bytes   | ABI-encoded attestation data (see [Encoding `data`](#encoding-data) below) |
| `value`          | uint256 | Always `0` (no ETH attached) |
| `nonce`          | uint256 | Current EAS nonce for the attester (from `GET /api/eas/nonce`) |
| `deadline`       | uint64  | Unix timestamp after which the signature is invalid (e.g., 10 minutes from now) |

#### Signing Snippet

```js
const domain = {
  name: "EAS",
  version: "1.4.0",
  chainId: 66238,                    // from nonce response
  verifyingContract: easAddress,     // from nonce response
};

const types = {
  Attest: [
    { name: "attester",        type: "address" },
    { name: "schema",          type: "bytes32" },
    { name: "recipient",       type: "address" },
    { name: "expirationTime",  type: "uint64"  },
    { name: "revocable",       type: "bool"    },
    { name: "refUID",          type: "bytes32" },
    { name: "data",            type: "bytes"   },
    { name: "value",           type: "uint256" },
    { name: "nonce",           type: "uint256" },
    { name: "deadline",        type: "uint64"  },
  ],
};

const message = {
  attester: walletAddress,
  schema: schemaUid,
  recipient: recipientAddress,                          // see below
  expirationTime: 0n,
  revocable: false,
  refUID: "0x" + "0".repeat(64),
  data: abiEncodedData,                                 // see below
  value: 0n,
  nonce: BigInt(nonce),                                 // from GET /api/eas/nonce
  deadline: BigInt(Math.floor(Date.now() / 1000) + 600), // 10 min
};

const signature = await wallet.signTypedData(domain, types, message);
```

Then submit the POST body as:

```json
{
  "attester": "0x...",
  "signature": "0x...65-byte-sig...",
  "prepared": {
    "delegatedRequest": {
      "schema": "<schemaUid>",
      "attester": "<walletAddress>",
      "easContractAddress": "<easAddress>",
      "chainId": 66238,
      "recipient": "<recipientAddress>",
      "expirationTime": "0",
      "revocable": false,
      "refUID": "0x000...000",
      "data": "0x...encoded...",
      "value": "0",
      "nonce": "0",
      "deadline": "1739000000"
    },
    "typedData": {
      "domain": { "name": "EAS", "version": "1.4.0", "chainId": 66238, "verifyingContract": "0x..." },
      "types": { "Attest": [ ... ] },
      "message": { ... }
    }
  }
}
```

The `prepared.typedData` must contain the exact `domain`, `types`, and `message` you signed. The server uses `prepared.typedData.message` to rebuild the typed data with the server-fetched nonce and then verifies the signature.

### Recipient Address Derivation

The `recipient` field is a [DID Address](/start-here/definitions#did-address) — a 20-byte value derived from the attestation's `subject` DID. The SDK resolves it using this priority:

1. If `subject` is a DID string (starts with `did:`): `recipient = didToAddress(subject)` — hash the normalized DID with keccak256, then take the low-order 160 bits.
2. If `subjectDidHash` is a 32-byte hex string: `recipient = computeDidAddress(subjectDidHash)` — take the low-order 160 bits of the hash. Same pipeline as step 1, starting from the already-computed hash.
3. If `recipient` is provided directly as a valid address: use it as-is.
4. Otherwise: `0x0000000000000000000000000000000000000000`.

The SDK's `prepareDelegatedAttestation` handles this automatically. Manual integrators must compute the recipient themselves using the same logic.

### Encoding `data`

The `data` field must be ABI-encoded according to the schema's Solidity type string. For example, the User Review schema:

```
string subject, string version, uint256 ratingValue, string reviewBody, string[] screenshotUrls, string[] proofs
```

is encoded using:

```js
import { AbiCoder } from "ethers";

const encoded = AbiCoder.defaultAbiCoder().encode(
  ["string", "string", "uint256", "string", "string[]", "string[]"],
  [subject, version, ratingValue, reviewBody, screenshotUrls, proofs]
);
```

### `subjectDidHash` Auto-Computation

If the schema includes a `subjectDidHash` field and the attestation data contains a `subject` that starts with `did:`, the SDK automatically computes `subjectDidHash = keccak256(normalize(subject))` before encoding.

Manual integrators must compute and include `subjectDidHash` themselves when the schema requires it. If omitted, the on-chain attestation data will have an empty or zero hash for that field.

### Nonce Refresh

The server re-fetches the attester's nonce from the EAS contract at submission time and uses that authoritative value to rebuild the typed data for signature verification.

After fetching the delegated attestation nonce and signing the EIP-712 payload, do not start another delegated EAS action for the same attester until this request succeeds or fails. If submission fails because the nonce changed, fetch a fresh nonce, rebuild the payload, re-sign, and resubmit.

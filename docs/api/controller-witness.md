---
id: controller-witness
title: Controller Witness API
sidebar_position: 1
---

# Controller Witness API

The Controller Witness API creates an immutable on-chain record that a trusted witness observed a controller assertion at a specific point in time. This solves the **mutable evidence problem**: when a subject removes or changes their DNS TXT or `did.json`, verifiers can no longer confirm that a key was authorized. The witness attestation preserves that proof permanently.

## Endpoint

```
POST https://api.omatrust.org/v1/controller-witness
```

Requires authentication (session cookie for web clients). Consumes one sponsored write from the user's subscription quota.

## Request (Recommended)

Use `requestControllerWitness` from the SDK or call the API directly with:

| Field | Type | Required | Description |
|---|---|---|---|
| `subjectDid` | string | Yes | Subject DID (e.g., `did:web:example.com`) |
| `controllerDid` | string | Yes | Controller DID — either `did:pkh:eip155:<chainId>:<address>` or `did:jwk:<encoded-public-key>` |
| `chainId` | number | No | Chain ID (defaults to the API's active chain) |

### Example Request

```bash
curl -X POST https://api.omatrust.org/v1/controller-witness \
  -H "Content-Type: application/json" \
  --cookie "omatrust_session=..." \
  -d '{
    "subjectDid": "did:web:example.com",
    "controllerDid": "did:pkh:eip155:66238:0x1234567890abcdef1234567890abcdef12345678"
  }'
```

### SDK Usage

```ts
import { requestControllerWitness } from "@oma3/omatrust/reputation";

const result = await requestControllerWitness({
  apiUrl: "https://api.omatrust.org/v1/controller-witness",
  subjectDid: "did:web:example.com",
  controllerDid: "did:pkh:eip155:66238:0x1234...",
});

console.log(result.uid, result.method);
```

## Response (Success)

```json
{
  "success": true,
  "uid": "0x...",
  "txHash": "0x...",
  "blockNumber": 12345,
  "observedAt": 1738972800,
  "method": "dns-txt"
}
```

| Field | Type | Description |
|---|---|---|
| `success` | boolean | `true` |
| `uid` | string \| null | EAS attestation UID of the Controller Witness attestation |
| `txHash` | string | Transaction hash |
| `blockNumber` | number | Block number |
| `observedAt` | number | Unix timestamp when the witness observed the controller assertion |
| `method` | string | Evidence method used (`dns-txt` or `did-json`) |

## Error Codes

| HTTP Status | Code | Description |
|---|---|---|
| 400 | `INVALID_DID` | Subject or controller is not a valid DID |
| 400 | `UNSUPPORTED_SUBJECT_TYPE` | Subject is not a `did:web` (required for endpoint evidence discovery) |
| 401 | `UNAUTHENTICATED` | No valid session |
| 403 | `SPONSORED_WRITE_LIMIT_EXCEEDED` | User's write quota is exhausted |
| 403 | `SCHEMA_NOT_ELIGIBLE` | Controller witness schema not allowed for the user's plan |
| 422 | `EVIDENCE_NOT_FOUND` | Controller not confirmed by endpoint evidence (DNS TXT or DID document) |
| 500 | `SCHEMA_NOT_DEPLOYED` | Controller witness schema not deployed on the active chain |
| 500 | `SERVER_ERROR` | Server wallet not configured or submission failed |

### Client-Side DID Validation

Use the SDK's `validatePrivateKeyDid()` to pre-validate the `controllerDid` before calling the API. This catches malformed DIDs early and provides detailed error messages:

```ts
import { validatePrivateKeyDid } from "@oma3/omatrust/identity";

const result = validatePrivateKeyDid(controllerDid);
if (!result.valid) {
  console.error(result.error);
  // e.g., "Invalid eip155 chain ID "abc" (must be numeric)"
}
```

The controller DID must be a private-key DID — either `did:pkh:eip155:<chainId>:<address>` for EVM wallets or `did:jwk:<encoded-public-key>` for non-EVM keys. The `subjectDid` must be a `did:web`.

## How It Works

1. The API authenticates the user's session and checks their sponsored write quota
2. It discovers endpoint evidence for the subject DID (DNS TXT at `_controllers.<domain>` and `/.well-known/did.json`)
3. If the controller DID is confirmed by endpoint evidence, it submits a Controller Witness attestation using the OMA3 server wallet
4. One sponsored write is deducted from the user's quota

The OMA3 server wallet is the attester — this is what gives the witness attestation its trust value. A verifier can check that the attester is a known OMA3 wallet.

## Prerequisites

Before calling this API, the subject must have:

1. **Controller evidence published** — either a DNS TXT record at `_controllers.<domain>` or a `did.json` at `/.well-known/did.json` containing the controller DID.

2. **An authenticated OMATrust session** — sign in via the OMATrust portal or backend session API.

### Setting Up DNS TXT Evidence

Add a TXT record to your domain:

| Record | Type | Value |
|---|---|---|
| `_controllers.example.com` | TXT | `v=1;controller=did:pkh:eip155:66238:0xYourAddress` |

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

Schema UID on OMAChain Testnet: `0xc81419f828755c0be2c49091dcad0887b5ca7342316dfffb4314aadbf8205090`

The schema is non-revocable. Once a witness attestation is created, it permanently records what was observed at that point in time.

## Deprecated: Legacy API Format

The legacy `callControllerWitness` SDK function and the old request format (with `attestationUid`, `easContract`, `schemaUid`, `method` fields) are still accepted for backward compatibility but will be removed in a future SDK version.

**Migrate to `requestControllerWitness`** which uses the simplified `{ subjectDid, controllerDid }` format. The backend handles evidence discovery, chain resolution, and schema lookup automatically.

## Future: x402 and OAuth DCR 2.0

The controller witness API currently requires a web session (cookie-based authentication). Future versions will support:

- **x402 signed receipts** — for headless/agent access with per-request payment
- **OAuth DCR 2.0** — for registered software clients with API keys

These will allow agents, wallets, and automated systems to request controller witnesses without a browser session.

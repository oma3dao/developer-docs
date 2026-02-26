---
sidebar_position: 2
---

# Reputation SDK

The Reputation SDK is the primary OMATrust developer surface.

It combines:

- attestation creation/submission
- delegated attestation flows
- attestation read/query
- proof creation and verification for all OMATrust proof types
- controller witness API

All in one module:

`@oma3/omatrust/reputation`

For the full function reference with types and error codes, see the [Reputation SDK Reference](/sdk/api-reference/reputation-sdk).

For end-to-end proof workflow guides (tx-encoded-value, DNS TXT, DID document, X.402 receipts, linked identifiers), see the [Attestations Guide](/reputation/attestation-types) and the [OMATrust Specification](https://github.com/oma3dao/omatrust-docs/specification).

## Quick Verification

If you just want to verify an attestation and check its proofs, here's the shortest path:

```ts
import {
  getAttestation,
  verifyAttestation,
} from "@oma3/omatrust/reputation";

// Fetch and verify in two calls
const attestation = await getAttestation({ uid, provider, easContractAddress, schema });
const result = await verifyAttestation({ attestation, provider });

if (result.valid) {
  // Attestation is structurally valid, not revoked/expired, and all proofs check out
  console.log("Verified:", attestation.data.subject);
} else {
  // result.reasons tells you what failed
  console.log("Failed:", result.reasons);
}
```

`verifyAttestation` handles structural validation, lifecycle checks (expiration, revocation), and cryptographic proof verification for all supported proof types. For most consumers, this is all you need.

For a deep dive into what's happening under the hood — proof types, binding rules, trust models, and manual verification logic — see the [Verification Flow](/reputation/verification-flow).

## Core Functions

```ts
submitAttestation(params)
prepareDelegatedAttestation(params)
submitDelegatedAttestation(params)
getAttestation(params)
listAttestations(params)
verifyAttestation(params)
callControllerWitness(params)
```

## Typical Workflow

1. Submit a direct attestation, or for User Review attestations prepare and sign a delegated attestation.
2. For Key Binding attestations call the controller witness after submission.
3. Read attestations by subject DID.
4. Verify proof(s) associated with each attestation.
5. Aggregate into summary metrics when needed.

## Example: Direct Attestation (Key Binding)

This example shows the full Key Binding flow: create a DNS TXT evidence proof, submit the attestation, then trigger the controller witness to verify the binding.

```ts
import {
  submitAttestation,
  createEvidencePointerProof,
  callControllerWitness,
} from "@oma3/omatrust/reputation";

// 1. Create a DNS TXT evidence proof
//    Assumes _omatrust.example.com TXT record contains: v=1;controller=did:key:z6Mkf5rGMoatrSj1f...
const proof = createEvidencePointerProof("https://dns.google/resolve?name=_omatrust.example.com&type=TXT");

// 2. Submit the Key Binding attestation
const result = await submitAttestation({
  signer,                                                                           // ethers v6 Signer
  chainId: 66238,                                                                   // OMAChain Testnet
  easContractAddress: "0x8835AF90f1537777F52E482C8630cE4e947eCa32",
  schemaUid: "0x807b38ce9aa23fdde4457de01db9c5e8d6ec7c8feebee242e52be70847b7b966",  // Key Binding
  schema: "string subject, string keyId, string publicKeyJwk, string[] keyPurpose, string[] proofs, uint256 issuedAt, uint256 effectiveAt, uint256 expiresAt",
  data: {
    subject: "did:web:example.com",
    keyId: "did:key:z6Mkf5rGMoatrSj1f...",
    publicKeyJwk: JSON.stringify({ kty: "EC", crv: "secp256k1", x: "...", y: "..." }),
    keyPurpose: ["assertionMethod"],
    proofs: [JSON.stringify(proof)],
    issuedAt: Math.floor(Date.now() / 1000),
    effectiveAt: Math.floor(Date.now() / 1000),
    expiresAt: 0,
  },
  revocable: true,                                                                  // Keys can be rotated/revoked
});

console.log(result.uid, result.txHash);

// 3. Call the controller witness to verify the key binding
const witness = await callControllerWitness({
  gatewayUrl: "https://api.omatrust.org/v1/controller-witness",
  attestationUid: result.uid,
  chainId: 66238,
  easContract: "0x8835AF90f1537777F52E482C8630cE4e947eCa32",
  schemaUid: "0x807b38ce9aa23fdde4457de01db9c5e8d6ec7c8feebee242e52be70847b7b966",
  subject: "did:web:example.com",
  controller: "did:key:z6Mkf5rGMoatrSj1f...",
});

console.log(witness.ok, witness.method);                                            // true, "dns-txt"
```

The `schema` field accepts either a `SchemaField[]` array or an EAS schema string (as above).

The `data` object keys must match the schema field names.

## Example: Delegated Attestation

```ts
import {
  prepareDelegatedAttestation,
  submitDelegatedAttestation,
} from "@oma3/omatrust/reputation";

const prepared = await prepareDelegatedAttestation({
  chainId: 66238,                                                                   // OMAChain Testnet
  easContractAddress: "0x8835AF90f1537777F52E482C8630cE4e947eCa32",
  schemaUid: "0x7ab3911527e5e47eaab9f5a2c571060026532dde8cb4398185553053963b2a47",  // User Review
  schema: "string subject, string version, uint256 ratingValue, string reviewBody, string[] screenshotUrls, string[] proofs",
  data: {
    subject: "did:web:example.com",
    version: "1.0.1",
    ratingValue: 4,
    reviewBody: "Good service",
    screenshotUrls: [],
    proofs: [],
  },
  attester: "0x...",                                                                // Your wallet address
  nonce: 0n,
});

// Sign the EIP-712 typed data with any wallet/signer
const signature = await signer.signTypedData(
  prepared.typedData.domain,
  prepared.typedData.types,
  prepared.typedData.message
);

const result = await submitDelegatedAttestation({
  relayUrl: "https://api.omatrust.org/v1/delegated-attest",
  prepared,
  signature,
});

console.log(result.uid, result.status);
```

## Example: Read + Verify

```ts
import {
  getAttestation,
  verifyAttestation,
} from "@oma3/omatrust/reputation";

const attestation = await getAttestation({
  uid: result.uid,
  provider,                                                                         // ethers v6 Provider
  easContractAddress: "0x8835AF90f1537777F52E482C8630cE4e947eCa32",
  schema: "string subject, string version, uint256 ratingValue, string reviewBody, string[] screenshotUrls, string[] proofs",
});

console.log(attestation.data.subject);                                              // "did:web:example.com"
console.log(attestation.data.ratingValue);                                          // 4

const verification = await verifyAttestation({
  attestation,
  provider,
});

console.log(verification.valid, verification.reasons);
```

## Notes

- No React or framework dependencies.
- Consumer provides signer/provider from any wallet framework.
- Chain addresses and schema UIDs are supplied by consumer config, not baked into the package.
- The `gatewayUrl` for `callControllerWitness` is passed in by you — not hardcoded. You decide whether to call your own API route or a shared gateway. See the [Controller Witness API](../api/controller-witness.md) for the raw endpoint contract.
- `@ethereum-attestation-service/eas-sdk` is a required peer dependency for this module.

## Supported Proof Types

The SDK provides creation and verification functions for all seven proof types defined in the [OMATrust Proof Specification](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-proofs.md):

| Proof Type          | Purpose              | Description                                                  |
| ------------------- | -------------------- | ------------------------------------------------------------ |
| `pop-jws`           | `shared-control`     | JWS signature proof for non-EVM signers                      |
| `pop-eip712`        | `shared-control`     | EIP-712 typed data signature proof for EVM wallets           |
| `x402-receipt`      | `commercial-tx`      | x402 service receipt proving service delivery                |
| `x402-offer`        | `commercial-tx`      | x402 signed offer proving commercial terms were presented    |
| `evidence-pointer`  | `shared-control`     | URL-based evidence (DNS TXT, DID document, social profile)   |
| `tx-encoded-value`  | both                 | Deterministic native-value transfer proof                    |
| `tx-interaction`    | `commercial-tx`      | On-chain smart contract interaction proof                    |

See the [Reputation SDK Reference](/sdk/api-reference/reputation-sdk) for the full `create*Proof` and `verifyProof` function signatures.

## Real-World Example

For a production example of the SDK in use, see the [rep-attestation-frontend](https://github.com/oma3dao/rep-attestation-frontend) repository — the source for [reputation.omatrust.org](https://reputation.omatrust.org).

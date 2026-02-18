---
sidebar_position: 1
---

# SDK Getting Started

This guide is for the npm package:

`@oma3/omatrust`

## Install

```bash
npm install @oma3/omatrust ethers
```

If you use the reputation module (`submitAttestation`, `getAttestation`, etc.), you also need the EAS SDK:

```bash
npm install @ethereum-attestation-service/eas-sdk
```

The identity and app-registry modules (`normalizeDid`, `didToAddress`, CAIP utilities, registry helpers) work with just `ethers` — no EAS SDK required.

> **Note:** `ethers` and `@ethereum-attestation-service/eas-sdk` are peer dependencies. npm v7+ installs peer dependencies automatically, but will only warn (not error) if they're missing — so double-check they're in your `node_modules` if you use `--legacy-peer-deps`. If you use pnpm or yarn, you may need to install them explicitly.
>
> The `canonicalize` package (used internally for JCS / RFC 8785 canonicalization) is a regular dependency and is bundled automatically — you don't need to install it separately.

## Prerequisite: Gas Funding for Direct Attestations

If you use direct on-chain submission (`submitAttestation`), the signing wallet must have enough native gas token on the target chain to pay transaction fees.

- Example: on OMAChain, fund the signer with OMA. 
- If the wallet has insufficient balance, submission will fail before attestation is recorded.
- User review attestations can avoid gas fees on OMAChain by using `submitDelegatedAttestation`.

## Quick Start (Reputation)

```ts
import { submitAttestation } from "@oma3/omatrust/reputation";

const result = await submitAttestation({
  signer,                                                                           // ethers v6 Signer
  chainId: 66238,                                                                   // OMAChain Testnet
  easContractAddress: "0x8835AF90f1537777F52E482C8630cE4e947eCa32",
  schemaUid: "0x7ab3911527e5e47eaab9f5a2c571060026532dde8cb4398185553053963b2a47",  // User Review
  schema: "string subject, string version, uint256 ratingValue, string reviewBody, string[] screenshotUrls, string[] proofs",
  data: {
    subject: "did:web:example.com",
    version: "1.0.1",
    ratingValue: 5,
    reviewBody: "Verified service behavior",
    screenshotUrls: [],
    proofs: []
  },
  revocable: false,
});

console.log(result.uid, result.txHash);
```

## Quick Start (Read + Verify)

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

// Print the decoded attestation data
console.log(attestation.data.subject);                                              // "did:web:example.com"
console.log(attestation.data.ratingValue);                                          // 5

// Verification will flag missing proofs since none were submitted above
const verification = await verifyAttestation({
  attestation,
  provider,
});

console.log(verification.valid, verification.reasons);                              // false, ["no proofs provided"]
```

## Quick Start (Identity)

```ts
import {
  normalizeDid,
  didToAddress,
  computeDidHash,
} from "@oma3/omatrust/identity";

const did = normalizeDid("did:web:Example.Com");
// "did:web:example.com"

const hash = computeDidHash(did);
// "0x505b0e657e7acabd2c14e517173a347faed486bb69081ef673c6e52c03f57f3e"

const address = didToAddress(did);
// "0x173a347faed486bb69081ef673c6e52c03f57f3e" (lowercase, non-checksummed)
```

## Quick Start (App Registry)

> Coming soon — the app-registry module is in testnet-only mode and has not been audited. See the [App Registry Reference](/app-registry/registry-sdk-reference) for current API details.

## Module Map

| Import path                        | Description                                                                | EAS SDK required? |
| ---------------------------------- | -------------------------------------------------------------------------- | ----------------- |
| `@oma3/omatrust/reputation`        | Attestation submission, querying, verification, proofs, controller witness | Yes               |
| `@oma3/omatrust/identity`          | DID normalization, hashing, CAIP utilities, JSON canonicalization           | No                |
| `@oma3/omatrust/app-registry`      | ERC-8004 helpers: traits, interfaces, status, versioning, data hash        | No                |

## Error Handling

All SDK functions throw `OmaTrustError` with a stable `code` property:

```ts
try {
  await submitAttestation(params);
} catch (err) {
  if (err.code === "NETWORK_ERROR") {
    // retry or switch RPC
  }
}
```

See the [Reputation Reference](/sdk/api-reference/reputation-sdk) and [Identity Reference](/sdk/api-reference/identity-sdk) for the full error code tables.

## Further Reading

- [Reputation SDK Overview](/sdk/guides) — workflow examples for attestation and verification
- [Reputation SDK Reference](/sdk/api-reference/reputation-sdk) — canonical function signatures and types
- [Identity SDK Reference](/sdk/api-reference/identity-sdk) — DID, CAIP, and data utility functions
- [App Registry Reference](/app-registry/registry-sdk-reference) — canonical function signatures for app registry
- [Attestations Guide](/reputation/attestation-types) — end-to-end proof workflow documentation
- [OMATrust Specification](https://github.com/oma3dao/omatrust-docs) — formal protocol specification

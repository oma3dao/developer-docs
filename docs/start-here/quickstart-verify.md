---
title: "Quickstart: Verify Reputation"
---

# Quickstart: Verify Reputation

Look up and verify an on-chain attestation in under 5 minutes.

## 1. Install

```bash
npm install @oma3/omatrust ethers @ethereum-attestation-service/eas-sdk
```

## 2. Read an Attestation

```ts
import {
  getAttestation,
  verifyAttestation,
} from "@oma3/omatrust/reputation";

// You need an ethers v6 Provider connected to the chain where the attestation lives
const attestation = await getAttestation({
  uid: "0x<attestation-uid>",                                                       // UID of the attestation to look up
  provider,                                                                         // ethers v6 Provider
  easContractAddress: "0x8835AF90f1537777F52E482C8630cE4e947eCa32",                 // EAS contract on OMAChain Testnet
  schema: "string subject, string version, uint256 ratingValue, string reviewBody, string[] screenshotUrls, string[] proofs",
});

console.log(attestation.data.subject);      // "did:web:example.com"
console.log(attestation.data.ratingValue);   // 5
```

## 3. Verify the Attestation

```ts
const verification = await verifyAttestation({
  attestation,
  provider,
});

console.log(verification.valid);    // true or false
console.log(verification.reasons);  // array of reasons if invalid
```

`verifyAttestation` checks that the attestation is on-chain, not revoked, and that any attached proofs are valid. If no proofs were submitted with the attestation, it will flag that.

## What's Next

- [Publish an attestation](/start-here/quickstart-publish) — Issue your own attestation
- [Reputation SDK Reference](/sdk/api-reference/reputation-sdk) — Full function signatures and error codes
- [Attestation Types](/reputation/attestation-types) — Understand the different attestation schemas

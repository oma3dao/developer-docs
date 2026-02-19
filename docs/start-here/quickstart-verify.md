---
title: "Quickstart: Verify Reputation"
---

# Quickstart: Verify Reputation

Look up and verify an on-chain attestation.

## 1. Install

```bash
npm install @oma3/omatrust ethers @ethereum-attestation-service/eas-sdk
```

## 2. Look Up Attestations by Subject

Use the same `did:web:example.com` from the [Publish quickstart](/start-here/quickstart-publish) to find all attestations about that service:

```ts
import {
  listAttestations,
  verifyAttestation,
} from "@oma3/omatrust/reputation";

// You need an ethers v6 Provider connected to the chain where the attestation lives
const attestations = await listAttestations({
  subject: "did:web:example.com",                                                   // The DID you published in the quickstart
  provider,                                                                         // ethers v6 Provider
  easContractAddress: "0x8835AF90f1537777F52E482C8630cE4e947eCa32",                 // EAS contract on OMAChain Testnet
  schema: "string subject, string version, uint256 ratingValue, string reviewBody, string[] screenshotUrls, string[] proofs",
});

console.log(`Found ${attestations.length} attestation(s)`);
console.log(attestations[0].data.subject);      // "did:web:example.com"
console.log(attestations[0].data.ratingValue);   // 5
```

## 3. Verify Each Attestation

```ts
for (const attestation of attestations) {
  const verification = await verifyAttestation({
    attestation,
    provider,
  });

  console.log(attestation.uid, verification.valid, verification.reasons);
}
```

`verifyAttestation` checks that the attestation is on-chain, not revoked, and that any attached proofs are valid. If no proofs were submitted with the attestation, it will flag that.

## What's Next

- [Publish an attestation](/start-here/quickstart-publish) — Issue your own attestation
- [Reputation SDK Reference](/sdk/api-reference/reputation-sdk) — Full function signatures and error codes
- [Attestation Types](/reputation/attestation-types) — Understand the different attestation schemas

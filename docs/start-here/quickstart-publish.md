---
title: "Quickstart: Publish Attestation"
---

# Quickstart: Publish Attestation

Submit a verifiable attestation to EAS.

## 1. Install

```bash
npm install @oma3/omatrust ethers @ethereum-attestation-service/eas-sdk
```

## 2. Fund Your Wallet

The signing wallet needs native gas tokens on the target chain to pay transaction fees.

- On OMAChain Testnet, fund the signer with OMA using the [OMAChain Testnet faucet](https://faucet.testnet.chain.oma3.org/)
- To avoid gas fees, use `submitDelegatedAttestation` instead (see [Delegated Attestation API](/api/delegated-attestation))

## 3. Submit an Attestation

```ts
import { submitAttestation } from "@oma3/omatrust/reputation";

const result = await submitAttestation({
  signer,                                                                           // ethers v6 Signer
  chainId: 66238,                                                                   // OMAChain Testnet
  easContractAddress: "0x8835AF90f1537777F52E482C8630cE4e947eCa32",
  schemaUid: "0x7ab3911527e5e47eaab9f5a2c571060026532dde8cb4398185553053963b2a47",  // User Review schema
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

console.log(result.uid);     // attestation UID
console.log(result.txHash);  // transaction hash
```

## 4. Confirm It Onchain

```ts
import { getAttestation } from "@oma3/omatrust/reputation";

const attestation = await getAttestation({
  uid: result.uid,
  provider,
  easContractAddress: "0x8835AF90f1537777F52E482C8630cE4e947eCa32",
  schema: "string subject, string version, uint256 ratingValue, string reviewBody, string[] screenshotUrls, string[] proofs",
});

console.log(attestation.data.subject);  // "did:web:example.com"
```

## What's Next

- [Verify reputation](/start-here/quickstart-verify) — Read and verify attestations
- [Delegated Attestation API](/api/delegated-attestation) — Gas-subsidized attestations
- [Reputation SDK Reference](/sdk/api-reference/reputation-sdk) — Full function signatures and error codes
- [Issuer Workflow](/reputation/issuer-workflow) — Become an attestation issuer

---
title: "Use Case: Claim Files/Artifacts"
sidebar_position: 5
---

# Use Case: Claim Responsibility for a File

Prove that your organization created, maintains, or distributes a specific file using `did:artifact` and a Responsibility Claim attestation.

## When to Use This

- You publish software binaries and want to prove provenance
- You distribute packages and want consumers to verify the source
- You maintain open-source libraries and want to publicly claim ownership
- You need verifiable supply chain attestations for compliance

## How It Works

1. **Compute the artifact DID** — The file's SHA-256 hash becomes a content-addressed `did:artifact` identifier. The same file always produces the same DID.
2. **Publish a Responsibility Claim** — An authorized controller of your organization's DID issues an on-chain attestation declaring your responsibility (creator, distributor, or maintainer) for that artifact.
3. **Anyone can verify** — Given the file, anyone computes the `did:artifact` and queries for Responsibility Claims. The system verifies that the attester was authorized to act for the claimed responsible party at the time of issuance.

## Quick Example

```ts
import { artifactDidFromBytes } from "@oma3/omatrust/identity";
import { submitAttestation } from "@oma3/omatrust/reputation";
import { readFileSync } from "fs";

// 1. Compute the did:artifact from the file
const fileBytes = readFileSync("./my-package-v2.1.0.tar.gz");
const artifactDid = artifactDidFromBytes(fileBytes);
// → "did:artifact:bafkreibm6jg3ux5qumhcn2b3flc3tyu6dmlb4xa7u5bf44yegnrjhc4yeq"

// 2. Publish a Responsibility Claim
const result = await submitAttestation({
  signer,
  chainId: 66238,
  easContractAddress: "0x8835AF90f1537777F52E482C8630cE4e947eCa32",
  schemaUid: "0x8779...b651",  // Responsibility Claim schema
  schema: "string subject, string responsibleParty, string[] responsibilityType, string subjectLabel, uint256 issuedAt, uint256 effectiveAt, uint256 expiresAt",
  data: {
    subject: artifactDid,
    responsibleParty: "did:web:your-organization.com",
    responsibilityType: ["creator", "maintainer"],
    subjectLabel: "my-package-v2.1.0.tar.gz",
    issuedAt: Math.floor(Date.now() / 1000),
    effectiveAt: Math.floor(Date.now() / 1000),
    expiresAt: 0,  // No expiration
  },
  revocable: true,
});

console.log(result.uid);  // attestation UID
```

## Verifying an Artifact

```ts
import { artifactDidFromBytes } from "@oma3/omatrust/identity";
import { getVerifiedArtifactAttestations } from "@oma3/omatrust/reputation";
import { readFileSync } from "fs";

// Compute the DID from the file you want to verify
const fileBytes = readFileSync("./my-package-v2.1.0.tar.gz");
const artifactDid = artifactDidFromBytes(fileBytes);

// Query and verify all attestations for this artifact
const result = await getVerifiedArtifactAttestations({
  artifactDid,
  provider,
  easContractAddress: "0x8835AF90f1537777F52E482C8630cE4e947eCa32",
});

for (const claim of result.responsibilityClaims) {
  console.log(claim.verification.responsibleParty);   // "did:web:your-organization.com"
  console.log(claim.verification.responsibilityTypes); // ["creator", "maintainer"]
  console.log(claim.verification.valid);               // true
}
```

## Using the Portal (No Code)

You can also publish and verify Responsibility Claims through the [OMATrust Portal](https://reputation.omatrust.org):

1. **Publish**: Click "Publish" on the dashboard → select "Responsibility Claim" schema → fill in the artifact DID (or upload a file to compute it) and your responsibility type → submit
2. **Verify**: Go to the Verify page → select "Artifact" → paste a `did:artifact` or upload a file → view all verified claims

## Prerequisites

- Your organization has an established DID (e.g., `did:web:your-org.com`)
- The signing wallet is an authorized controller of that DID (established via a Controller Witness or similar mechanism)
- The signing wallet has gas tokens on OMAChain (or use [delegated attestation](/api/delegated-attestation) for gasless submission)

## Further Reading

- [Attestation Types: Responsibility Claim](/reputation/attestation-types#responsibility-claim) — Full schema documentation
- [Issuer Workflow](/reputation/issuer-workflow) — General attestation creation guide
- [Use Case: Authorize Signing Keys](/start-here/use-case-signing-keys) — Establish controller authorization before claiming
- [Consumer Workflow: Responsibility Claims](/reputation/consumer-workflow#responsibility-claims) — How consumers verify claims

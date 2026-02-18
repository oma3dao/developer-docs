---
title: Verification Flow
---

# Verification Flow

This page explains how consumers (apps, AI agents, smart contracts) query and verify attestations to make trust decisions.

## Overview

Verification in OMATrust follows a simple pattern:

1. Look up attestations for a subject DID
2. Decode the attestation data using the schema
3. Verify the attestation is valid (not revoked, not expired, proofs check out)
4. Apply your own trust logic based on the attestations present

## SDK Verification

The simplest path is using the OMATrust SDK:

```ts
import {
  getAttestation,
  verifyAttestation,
} from "@oma3/omatrust/reputation";

// Fetch an attestation by UID
const attestation = await getAttestation({
  uid: "0x<attestation-uid>",
  provider,
  easContractAddress: "0x8835AF90f1537777F52E482C8630cE4e947eCa32",
  schema: "string subject, string version, uint256 ratingValue, string reviewBody, string[] screenshotUrls, string[] proofs",
});

// Verify it
const result = await verifyAttestation({ attestation, provider });
console.log(result.valid, result.reasons);
```

See the [Reputation SDK Reference](/sdk/api-reference/reputation-sdk) for the full API.

## Frontend Verification

```typescript
import { EAS } from '@ethereum-attestation-service/eas-sdk';

const eas = new EAS(easContractAddress);
const attestation = await eas.getAttestation(attestationUID);

// Check basic validity
const isValid = !attestation.revoked && 
  (attestation.expirationTime === 0 || attestation.expirationTime > Date.now() / 1000);
```

## AI Agent Integration

```python
# Python example for AI agents
import web3
from eth_utils import keccak

def verify_service(did: str, provider):
    # Query EAS for attestations referencing this subject DID
    # Apply trust logic based on attestation types present
    # e.g., require at least one security assessment + key binding
    pass
```

AI agents should check for multiple attestation types before trusting a service. A service with a Key Binding, Controller Witness, and Security Assessment has stronger verifiable reputation than one with no attestations.

## Common Verification Patterns

### Pattern 1: Key Binding + Controller Witness

The most common identity verification pattern:

1. Subject publishes a Key Binding attestation binding their wallet to their `did:web`
2. Subject publishes controller evidence (DNS TXT or `did.json`)
3. A witness server observes the evidence and issues a Controller Witness attestation
4. Consumers check for both attestations to confirm the subject controls the DID

### Pattern 2: Security Assessment Check

Before interacting with a DeFi protocol or API:

1. Query attestations for the subject DID
2. Filter for Security Assessment attestation types
3. Check the `assessmentKind`, `outcome`, and `metrics` in the payload
4. Verify the attester is a reputable auditor
5. Check `expiresAt` to ensure the assessment is current

### Pattern 3: User Review Aggregation

For consumer-facing trust signals:

1. Query all User Review attestations for a subject DID
2. Check which reviews include proofs (x402 receipts indicate verified interaction)
3. Aggregate ratings, weighting proven reviews higher
4. Display trust signal to end users

## Best Practices

- Check multiple attestation types — don't rely on a single source
- Verify the attester's identity — a security assessment is only as trustworthy as the auditor
- Respect expiration — treat expired attestations as stale
- Cache results — avoid redundant on-chain queries for the same subject
- Fail gracefully — handle services that have no attestations yet

## Further Reading

- [Reputation Model](/reputation/reputation-model) — How reputation works in OMATrust
- [Attestation Types](/reputation/attestation-types) — Schema definitions for each type
- [SDK Getting Started](/sdk/getting-started) — Install and configure the SDK
- [Reputation SDK Reference](/sdk/api-reference/reputation-sdk) — Full function signatures

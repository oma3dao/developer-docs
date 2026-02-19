---
title: Consumer Workflow
---

# Consumer Workflow

This page covers how to query, interpret, and act on OMATrust attestations. Whether you're building a frontend app, an AI agent, an indexer, or a smart contract — you're a consumer of reputation data.

## What Consumers Do

As a consumer, your job is:

1. **Query** attestations for a subject DID
2. **Verify** each attestation (structural validity, proof verification, trust model)
3. **Interpret** the attestations based on your use case
4. **Present** trust signals to your users or use them in your logic

OMATrust provides the verifiable data. You decide what it means for your application.

## Querying Attestations

There are three ways to query attestations:

### Using the OMATrust SDK

The SDK provides high-level functions for listing and filtering attestations. See the [SDK Guides](/sdk/guides) for usage examples and the [Reputation SDK Reference](/sdk/api-reference/reputation-sdk) for the full API.

### Using EAS Directly

Attestations are stored on-chain via EAS (Ethereum Attestation Service). You can query EAS directly using the [@ethereum-attestation-service/eas-sdk](https://www.npmjs.com/package/@ethereum-attestation-service/eas-sdk) package. See the [EAS documentation](https://docs.attest.org) for SDK usage patterns.

You'll need the OMATrust schema UIDs to filter for specific attestation types. These are published in the [rep-attestation-tools-evm-solidity](https://github.com/oma3dao/rep-attestation-tools-evm-solidity) repository, or you can browse them in the [reputation.omatrust.org](https://reputation.omatrust.org) web interface.

### Via Indexer APIs

For production applications with high query volumes, use an indexer rather than querying the chain directly. Indexers aggregate and index attestations for efficient querying, including GraphQL APIs for flexible filtering.

### Common Query Patterns

Regardless of which method you use, the common query patterns are:

**By Subject DID** — The most common query: "what do we know about this service?" Returns User Reviews, Security Assessments, Endorsements, Certifications, and Support Attestations associated with that service.

**By Attester DID** — "What has this entity attested?" Useful for checking an auditor's track record or seeing all reviews from a specific user.

**By Schema Type** — Filter for specific attestation types. For example, query only Security Assessment attestations for a subject, or only User Reviews.

## Interpreting Attestations

After fetching attestations, run them through the [Verification Flow](/reputation/verification-flow):

1. **Structural validation** — Schema conformance, required fields, lifecycle checks
2. **Proof verification** — Verify any cryptographic proofs included
3. **Trust model application** — Proof-based trust or trusted-attester trust

Then interpret the results based on the attestation type.

### User Reviews

User Reviews are the most common reputation signal. Key interpretation points:

- **Check for proofs**: A review with a valid `x402-receipt` is a verified interaction — the reviewer demonstrably used the service. A review without proofs is unverified and should carry less weight.
- **Handle supersession**: If multiple reviews exist from the same attester for the same subject, only the most recent (by `issuedAt`) is current. Earlier reviews are historical.
- **Aggregate thoughtfully**: Weight verified reviews higher than unverified ones. See [Trust Scoring](/reputation/trust-scoring) for approaches.

Proof strength hierarchy for User Reviews:
1. `x402-receipt` — Proves payment and delivery (highest confidence)
2. `tx-interaction` — Proves on-chain interaction with the service contract
3. `evidence-pointer` — Proves account existence on the service
4. No proofs — Unverified (lowest confidence)

### User Review Responses

When displaying a User Review, check for associated User Review Response attestations:

1. Find responses where `refUID` matches the review's attestation UID
2. Verify responder coherence — the response `attester` should be the reviewed service or a verifiable delegate (check via Support Attestations)
3. Display the response alongside the review

### Security Assessments

Before trusting a service with sensitive operations:

1. Query Security Assessment attestations for the subject
2. Check `assessmentKind` — is it a pentest, security audit, code review, or vulnerability scan?
3. Check `outcome` — `pass` or `fail` (absent = `pass`)
4. Check `metrics` — how many critical/high/medium/low findings?
5. Check the attester — is this a reputable auditor? (trusted-attester validation)
6. Check `expiresAt` — is the assessment still current?
7. If `reportURI` and `reportDigest` are present, optionally fetch and verify the report

### Endorsements

Endorsements are lightweight trust signals. Their value depends entirely on who issued them:

1. Check the `attester` — do you trust this endorser?
2. Verify attester identity via Support Attestations if needed (e.g., Linked Identifier from `did:web:oma3.org` to the attester)
3. Check `policyUri` if present — it references the criteria used for formal approvals
4. Check lifecycle — `effectiveAt`, `expiresAt`

### Certifications

Certifications follow a three-party model (assessor → certification body → attestation):

1. Check the `attester` — is this a recognized Certification Body?
2. Check `programID` — what certification program does this represent?
3. Check `assessor` — who performed the evaluation?
4. Check `certificationLevel` if present
5. Check lifecycle — certifications often have expiration dates

### Support Attestations

Support Attestations (Linked Identifier, Key Binding, Controller Witness) are typically consumed indirectly — you check them when verifying the identity chain behind a Reputation Attestation. For example:

- A User Review Response's `attester` claims to be the service operator. You verify this by checking for a Linked Identifier or Key Binding linking the response attester to the service's DID.
- An Endorsement's `attester` claims to represent OMA3. You verify this by checking for a Linked Identifier from `did:web:oma3.org` to the attester's DID.

But you can also query Support Attestations directly to understand a service's identity posture:

- **Key Binding present?** The service has published authorized signing keys.
- **Controller Witness present?** A trusted witness has confirmed the service's controller assertion at a specific time.
- **Linked Identifiers present?** The service has established cross-platform identity links (e.g., linking their `did:web` to a social handle or wallet).

## Building Trust Signals from Multiple Types

A single attestation type rarely tells the full story. Combine multiple types for a richer picture:

**Strong reputation profile:**
- Key Binding + Controller Witness (identity is established and witnessed)
- Security Assessment with `outcome: pass` from a reputable auditor
- Multiple verified User Reviews with high ratings
- Endorsement from a recognized organization

**Minimal reputation profile:**
- Service is registered but has no attestations beyond basic identity

**Red flags:**
- Security Assessment with `outcome: fail` or high critical/high finding counts
- Verified negative reviews (low ratings with valid proofs)
- Revoked Key Bindings or Linked Identifiers without replacements
- Expired Security Assessments that haven't been renewed

## Caching and Performance

Attestation data changes infrequently, so caching is effective:

- **On-chain data** (attestation existence, revocation status) — Cache with moderate TTL (minutes to hours). Invalidate when you detect new attestations.
- **Proof verification results** — Cache aggressively. A proof that verified once will verify again unless the attestation is revoked.
- **Metadata and reports** (fetched from `reportURI`, `dataUrl`) — Cache with shorter TTL since offchain content can change.

For high-volume applications, use an indexer rather than querying the chain directly for every request.

## Best Practices

- **Check multiple attestation types** — Don't rely on a single source. A service with both a security assessment and verified reviews is more trustworthy than one with only reviews.
- **Verify the attester's identity** — A security assessment is only as trustworthy as the auditor. Use Support Attestations to confirm attester identity when needed.
- **Respect expiration and revocation** — Treat expired attestations as stale and revoked attestations as inactive.
- **Distinguish "no data" from "negative data"** — A new service with no attestations is unknown, not untrustworthy.
- **Fail gracefully** — Handle services that have no attestations yet. Not every service will have a full reputation profile.
- **Weight proofs appropriately** — Verified reviews (with valid proofs) should carry more weight than unverified ones.
- **Consider recency** — A recent security assessment is more relevant than one from two years ago.

## Further Reading

- [Reputation Model](/reputation/reputation-model) — How reputation works in OMATrust
- [Attestation Types](/reputation/attestation-types) — Schema definitions for each type
- [Verification Flow](/reputation/verification-flow) — Detailed verification logic
- [Trust Scoring](/reputation/trust-scoring) — Guidance on building scoring logic
- [Issuer Workflow](/reputation/issuer-workflow) — How attestations are created

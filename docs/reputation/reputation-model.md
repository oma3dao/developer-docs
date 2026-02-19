---
title: Reputation Model
---

# Reputation Model

OMATrust reputation is a system for publishing and verifying trust signals about **services** — applications, APIs, smart contracts, organizations, and other server-side actors. Unlike most decentralized reputation systems that evaluate users or client identities, OMATrust is explicitly concerned with the reputation of the services that users and machines depend on.

The system does not score, rank, or track end-users. It establishes verifiable trust signals about services, and leaves interpretation to the consumers reading those signals.

## How It Works

Reputation is built from **attestations** — cryptographically signed, structured statements made by one identity (the attester) about another (the subject). Each attestation conforms to a defined JSON schema and may optionally include **proofs**: cryptographic evidence objects that allow anyone to independently verify the claim without trusting the attester.

```
"I, [Attester DID], attest that [Subject DID] has [Property]"
```

For example:
- "SecureAudit Pro attests that did:web:defi.example.com passed a security assessment"
- "Alice attests that did:web:game.example.com deserves a 4-star rating, and here is an x402 receipt proving she used the service"
- "OMA3 Witness attests that the service with ID did:web:example.com asserted at timestamp 1720000000 that the wallet with ID did:pkh:eip155:66238:0xABC... is authorized to sign on behalf of the service"

Reputation for a given service is not a single number. It is the aggregate of all attestations associated with that service's DID. Consumers (or "Verifiers" in DID parlance)— humans, apps, AI agents — query those attestations and apply their own trust logic.

## Two Trust Models

Consumers can derive trust from attestations in two ways:

1. **Proof-based (trustless) validation** — The consumer independently verifies the cryptographic proof objects included in the attestation. No trust in the attester is required; the math speaks for itself.

2. **Trusted-attester validation** — The consumer accepts the attestation based on the identity and authority of the attester, checked against a local allowlist or trust policy. This is how endorsements and certifications typically work: you trust the attestation because you trust the organization that issued it. OMA3 will maintain curated lists of trusted attesters for different attestation types — for example, approved security auditors and the signing keys they use — so that consumers have a reliable starting point for their trust policies.

Both models are valid. Many attestations support both simultaneously — a consumer can verify the proofs if present, or fall back to attester trust if not.

## Two Layers of Attestations

OMATrust attestations are organized into two layers:

### Support Attestations

These establish the identity plumbing that everything else depends on. They answer questions like "who controls this DID?" and "which keys are authorized to sign for this service?"

| Type | Purpose |
|------|---------|
| **Linked Identifier** | Asserts that a subject DID and a linked DID are controlled by the same entity |
| **Key Binding** | Declares that a specific cryptographic key is authorized to act on behalf of a subject DID |
| **Controller Witness** | Anchors a timestamped observation that a subject asserted a particular controller via mutable offchain state (DNS, DID document, social profile) |

Downstream attestations (User Reviews, Security Assessments, etc.) rely on Support Attestations to verify signatures, resolve service operators, and confirm cross-system identity relationships.

### Reputation Attestations

These are the actual trust signals about services:

| Type | Purpose |
|------|---------|
| **User Review** | A 1–5 star review of a service, optionally backed by proof of interaction |
| **User Review Response** | A service operator's response to a specific User Review |
| **Endorsement** | A lightweight signal of support, trust, or approval for a service |
| **Certification** | A formal decision by a certification body that a service meets program requirements |
| **Security Assessment** | Results of a security evaluation (pentest, audit, code review, vulnerability scan) |

See [Attestation Types](/reputation/attestation-types) for the full schema reference.

## The Role of Proofs

Proofs are not attestations — they are supporting evidence objects attached to attestations. A proof is a structured JSON object that carries or references cryptographic evidence, allowing a consumer to independently verify a claim.

For example, a User Review attestation might include an `x402-receipt` proof demonstrating that the reviewer actually paid for and received the service. A Linked Identifier attestation might include a `pop-eip712` proof where the subject's wallet cryptographically signs approval of the linkage.

Not all attestations require proofs. Endorsements and Certifications rely on trusted-attester validation — you trust them because you trust the endorser or certification body. User Reviews can exist without proofs, but reviews with valid proofs carry stronger trust signals.

The proof system is covered in detail in [Verification Flow](/reputation/verification-flow).

## Attestation Lifecycle

Attestations follow a defined lifecycle:

1. **Issuance** — An attester creates the attestation, validates it against the JSON schema, and submits it to a transport (e.g., EAS on-chain)
2. **Effectiveness** — The attestation becomes active. If `effectiveAt` is set, the attestation is not considered active until that timestamp
3. **Active period** — The attestation is queryable and contributes to the subject's reputation
4. **Expiration** — If `expiresAt` is set, the attestation becomes stale after that timestamp. Consumers should treat expired attestations accordingly
5. **Revocation** — If supported by the JSON Schema, the original attester can revoke the attestation if circumstances change. Revoked attestations must not be treated as active
6. **Supersession** — For User Reviews, a new attestation from the same attester for the same subject supersedes the previous one. Only the most recent review counts

Revocation and expiration do not delete attestations — they remain as historical records. They only affect the current trust state.

## Transport Independence

The attestation model is designed to be transport-independent. The same JSON payload can be stored on EAS (Ethereum Attestation Service), BAS, a centralized system, or a federated indexer. The specification separates:

- **Semantic layer** — Schema definitions, validation rules, verification logic. Chain-agnostic and deterministic.
- **Transport layer** — How attestations are stored, referenced, and queried. Each transport (EAS, BAS, etc.) publishes its own binding rules.

This means attestations remain interoperable regardless of the infrastructure chosen by the service operator, user, or verifier.

## What OMATrust Does Not Do

OMATrust defines attestations, proof formats, and verification rules. It does **not** provide:

- Scoring, weighting, or ranking of services
- Recommendation logic
- Aggregated trust scores (at least for now)
- Approved verification processes for trusted attesters (this may come in future companion specifications)

How consumers interpret, aggregate, score, or visualize attestation data is entirely up to them. See [Trust Scoring](/reputation/trust-scoring) for guidance on building your own scoring logic.

## Specifications

For the formal, normative definitions:

- [OMATrust Reputation Specification](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-reputation.md) — Attestation schemas, verification rules, reputation flows
- [OMATrust Proof Specification](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-proofs.md) — Proof taxonomy, proof types, verification logic

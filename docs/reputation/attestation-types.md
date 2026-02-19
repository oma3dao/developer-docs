---
title: Attestation Types
---

# Attestation Types

OMATrust defines structured schemas for different attestation purposes. Each schema uses JSON Schema Draft 2020-12 as the canonical definition and is published in the [OMA3 schema repository](https://github.com/oma3dao/rep-attestation-tools-evm-solidity/tree/main/schemas-json).

:::note Normative Source of Truth
These developer docs are a guide — not the specification. OMA3 is a standards body, and the normative definitions for all attestation schemas, proof types, and verification rules live in the [OMATrust Reputation Specification](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-reputation.md) and [OMATrust Proof Specification](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-proofs.md). If anything on this page conflicts with the specifications, the specifications govern. For canonical field definitions, refer to the [JSON schema files](https://github.com/oma3dao/rep-attestation-tools-evm-solidity/tree/main/schemas-json) directly.
:::

All attestation types share common patterns: an `attester` DID, a `subject` DID, and an `issuedAt` timestamp. Attestations should be validated against the schema before issuance or acceptance — in practice, the SDK and transport layer (e.g., EAS) handle much of this automatically.

Attestations are organized into two layers: **Support Attestations** that establish identity relationships, and **Reputation Attestations** that carry the actual trust signals.

---

## Support Attestations

Support Attestations define the foundational relationships that allow [consumers](/start-here/definitions#common-terms) to reason about who controls which identifiers, which keys are authorized to sign for a service, and how identities across different systems are linked. Reputation Attestations depend on these to verify signatures and resolve service operators.

### Linked Identifier

Asserts that a subject DID and a linked DID are controlled by the same entity. This is the general-purpose identity linkage mechanism — use it when you need to prove "these two identifiers belong to the same entity."

The `subject` should be the primary, canonical identity (e.g., an organizational `did:web` or an immutable `did:pkh` for a smart contract). The `linkedId` should be the identifier with higher rotation frequency (e.g., a signing key's `did:pkh`, or a social handle via `did:handle`).

Key behaviors:
- Proofs are required for proof-based trust, using `proofPurpose = shared-control`
- Permitted proof types: `pop-eip712`, `pop-jws`, `tx-encoded-value`, `evidence-pointer`
- Linked Identifier attestations **must be revocable** — consumers must reject any that aren't

Schema: [linked-identifier.schema.json](https://github.com/oma3dao/rep-attestation-tools-evm-solidity/blob/main/schemas-json/linked-identifier.schema.json) · Spec: [Reputation Specification §6.1](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-reputation.md)

---

### Key Binding

Declares that a specific cryptographic public key is authorized to act on behalf of a subject DID. Unlike Linked Identifiers (which link abstract identifiers), Key Binding links the raw cryptographic material needed for digital signatures. It also provides lifecycle management: publication, rotation, expiration, and revocation.

The `keyPurpose` field specifies what the key is authorized to do, using values from [W3C DID Core Verification Relationships](https://www.w3.org/TR/did-core/#verification-relationships): `authentication`, `assertionMethod`, `keyAgreement`, `capabilityInvocation`, `capabilityDelegation`.

Key behaviors:
- At least one proof is required, using `proofPurpose = shared-control`
- Permitted proof types: `pop-eip712`, `pop-jws`, `tx-encoded-value`, `evidence-pointer`
- Multiple non-expired, non-revoked bindings can coexist (key rotation doesn't implicitly revoke earlier bindings)
- Key Binding attestations **must be revocable** — consumers must reject any that aren't

Schema: [key-binding.schema.json](https://github.com/oma3dao/rep-attestation-tools-evm-solidity/blob/main/schemas-json/key-binding.schema.json) · Spec: [Reputation Specification §6.2](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-reputation.md)

---

### Controller Witness

A third-party witness attestation that anchors a timestamped observation: at a specific time, a subject DID asserted a particular controller via mutable offchain state (DNS TXT record, DID document, social profile). This solves a real problem — offchain evidence can be removed or altered after the fact, so a witness creates an immutable on-chain record of what was observed.

Key behaviors:
- No proofs — trust derives from the identity and credibility of the witness [attester](/start-here/definitions#common-terms)
- Observation methods: `dns-txt`, `did-json`, `social-profile`, `manual`
- Consumers can use these in temporal proof mode (witness observation must predate the related attestation) or common-control mode (observation proves the assertion existed at some point)

Schema: [controller-witness.schema.json](https://github.com/oma3dao/rep-attestation-tools-evm-solidity/blob/main/schemas-json/controller-witness.schema.json) · Spec: [Reputation Specification §6.3](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-reputation.md)

---

## Reputation Attestations

These are the trust signals that consumers use to evaluate services.

### User Review

A structured 1–5 star review of a service or application. User Reviews are the primary mechanism for end-user feedback in OMATrust.

Proofs are optional but significantly affect trust level. User Reviews support two categories of evidence:

| Proof Category | proofPurpose | What It Proves | Allowed Proof Types |
|----------------|-------------|----------------|---------------------|
| Commercial transaction | `commercial-tx` | The reviewer transacted with the service | `x402-receipt` |
| Transaction interaction | `commercial-tx` | The reviewer interacted with the service's smart contract | `tx-interaction` |
| User account existence | `shared-control` | The reviewer has an account on the service | `evidence-pointer` |

A review with a valid `x402-receipt` (or `x402 offer`, which carries a different meaning) proof is an example of a user review providing the strongest evidence — it proves the reviewer paid for and received the service. A review without proofs is still valid but carries lower confidence.

Key behaviors:
- Attestations are immutable — to update a review, issue a new one for the same subject. Consumers must consider only the most recent from a given attester for a given subject.
- `ratingValue` ranges from 1 (worst) to 5 (best)
- `reviewBody` is optional, max 500 characters

Schema: [user-review.schema.json](https://github.com/oma3dao/rep-attestation-tools-evm-solidity/blob/main/schemas-json/user-review.schema.json) · Spec: [Reputation Specification §7.1](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-reputation.md)

---

### User Review Response

A response from a service operator to a specific User Review. This is how service owners acknowledge, rebut, clarify, or resolve feedback. Linked to the original review via `refUID`.

Key behaviors:
- The response `attester` should be the reviewed service or a verifiable delegate (established via Support Attestations)
- `refUID` must resolve to a valid User Review attestation
- Does not carry proofs — verification is based on reference resolution and responder coherence

Schema: [user-review-response.schema.json](https://github.com/oma3dao/rep-attestation-tools-evm-solidity/blob/main/schemas-json/user-review-response.schema.json) · Spec: [Reputation Specification §7.2](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-reputation.md)

---

### Endorsement

A lightweight signal indicating that an attester supports, trusts, approves, or recognizes a subject. Endorsements are intentionally minimal so they can be issued frequently and interpreted flexibly.

Endorsements are purely an attester-trust attestation — they carry no proofs. An endorsement is only as meaningful as the entity that issued it. If you trust the attester (e.g., OMA3 endorsing a member service), the endorsement carries weight. If you don't recognize the attester, it's just a claim.

Key behaviors:
- No proofs — trust depends entirely on whether the consumer trusts the attester (directly or via delegated trust through Support Attestations)
- Optional `policyUri` references the criteria used for formal approvals
- Supports the [payload container](#payload-container) pattern for evolvable details

Schema: [endorsement.schema.json](https://github.com/oma3dao/rep-attestation-tools-evm-solidity/blob/main/schemas-json/endorsement.schema.json) · Spec: [Reputation Specification §7.3](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-reputation.md)

---

### Certification

A formal decision by a Certification Body (CB) that a subject has satisfied the requirements of a specific certification program. Certifications follow a three-party flow:

1. An **assessor** (test lab, auditor) evaluates the subject
2. The **Certification Body** receives the assessment data and makes the certification decision
3. If positive, the CB issues the Certification attestation as the `attester`

Key behaviors:
- No proofs — trust depends on whether the consumer trusts the Certification Body
- Includes `programID` (DID of the certification program) and `assessor` (DID of the evaluating entity)
- Optional `certificationLevel` for classification (e.g., "Gold", "Level 2")
- Supports the [payload container](#payload-container) pattern

Schema: [certification.schema.json](https://github.com/oma3dao/rep-attestation-tools-evm-solidity/blob/main/schemas-json/certification.schema.json) · Spec: [Reputation Specification §7.4](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-reputation.md)

---

### Security Assessment

Records the results of a security evaluation performed by an assessor over a subject. Designed as a thin envelope — most methodological detail, evidence, and results are carried in the payload.

The default payload includes `assessmentKind` (`pentest`, `security-audit`, `code-review`, or `vulnerability-scan`), optional `outcome` (`pass` or `fail` — absent means `pass`), optional `metrics` (finding counts by severity), and optional `reportURI`/`reportDigest` for linking to the full report.

Key behaviors:
- No proofs — trust depends on whether the consumer trusts the assessor
- Supports the [payload container](#payload-container) pattern — if `payloadSpecURI` is present, the payload is interpreted using the referenced specification instead of the default structure
- If `reportURI` and `reportDigest` are both present, consumers can fetch and verify report integrity

Schema: [security-assessment.schema.json](https://github.com/oma3dao/rep-attestation-tools-evm-solidity/blob/main/schemas-json/security-assessment.schema.json) · Spec: [Reputation Specification §7.5](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-reputation.md)

---

## Payload Container

Several attestation types (Endorsement, Certification, Security Assessment) use a shared payload pattern for carrying evolvable details. The payload object's internal structure is attestation-specific. If `payloadSpecURI` is absent, the payload is interpreted using the default structure defined in the schema. If present, the referenced specification takes precedence.

Spec: [Reputation Specification §8](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-reputation.md)

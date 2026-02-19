---
title: Verification Flow
---

# Verification Flow

This page explains how [consumers](/start-here/definitions#common-terms) verify attestations — from basic structural checks through cryptographic proof verification to trust model application.

:::note Normative Source of Truth
These developer docs are a guide — not the specification. The normative definitions for proof types, verification algorithms, and binding rules live in the [OMATrust Proof Specification](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-proofs.md) and [OMATrust Reputation Specification](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-reputation.md). If anything on this page conflicts with the specifications, the specifications govern.
:::

## Overview

Verification is a three-step process:

1. **Structural validation** — Is the attestation well-formed and within its lifecycle?
2. **Proof verification** — Do the cryptographic proofs check out? (if present)
3. **Trust model application** — Based on the above, how much do you trust this attestation?

If you're using the SDK, `verifyAttestation()` handles all three steps. See the [Quick Verification](/sdk/guides#quick-verification) section in the SDK guides. The rest of this page explains what's happening under the hood.

## Step 1: Structural Validation

Before looking at proofs, validate the attestation itself:

- The decoded attestation data conforms to the expected schema for its attestation type
- Required fields (`attester`, `subject`, `issuedAt`, and type-specific fields) are present and well-formed
- `attester` and `subject` are valid DIDs
- `issuedAt` is a non-negative Unix timestamp
- If `effectiveAt` is present and in the future, the attestation is not yet active
- If `expiresAt` is present and in the past, the attestation is expired
- If `revoked` is `true`, the attestation is inactive
- For Linked Identifier and Key Binding attestations: the attestation must be revocable on the transport

Type-specific structural rules (supersession for User Reviews, `refUID` resolution for User Review Responses, etc.) are defined in the relevant schema sections of the [Reputation Specification](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-reputation.md).

## Step 2: Proof Verification

[Proofs](/start-here/definitions#proof-terms) are the mechanism for trustless verification. If an attestation includes a `proofs` array, each entry is a proof wrapper containing a native proof object. Consumers must verify each proof according to its declared `proofType`.

### The Proof Wrapper

Every proof uses a standard wrapper with `proofType` (required — identifies the verification algorithm) and `proofObject` (required — the native proof artifact). Optional fields include `proofPurpose`, `version`, `issuedAt`, and `expiresAt`.

The full wrapper schema is defined in [Proof Specification §5.3.1](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-proofs.md).

### Proof Taxonomy

Proofs are categorized along several dimensions. Understanding these helps you reason about what a proof can and can't tell you:

- **Identifier capability**: [Signer-capable identifiers](/start-here/definitions#proof-terms) (wallets, keys) produce cryptographic signatures. [Non-signer identifiers](/start-here/definitions#proof-terms) (social handles, DNS names) rely on trusted locations.
- **Evidence location**: Inline (embedded in the proof), URL (fetched from a reference), or transaction (obtained from a blockchain).
- **Proof purpose**: `shared-control` (identity binding, higher assurance) or `commercial-tx` (commercial interaction, lower friction).

The full taxonomy is in [Proof Specification §5.1](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-proofs.md).

### Attestation-Layer Proof Constraints

Each attestation type defines which proof types and purposes are permitted, and how attestation fields must map to proof parameters (Subject, Controller, proofPurpose). A proof that is cryptographically valid but violates these constraints must be rejected.

For example, a Linked Identifier proof must use `proofPurpose = shared-control` with the proof's Subject matching the attestation's `subject` and Controller matching `linkedId`. A User Review commercial transaction proof must use `proofPurpose = commercial-tx` with Subject matching the reviewed service and Controller matching the reviewer.

The binding rules for each attestation type are defined in the relevant schema sections of the [Reputation Specification](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-reputation.md) (§6.1.3 for Linked Identifier, §6.2.3 for Key Binding, §7.1.3 for User Review).

### Proof Types

OMATrust defines seven proof types. Each has its own native format, verification algorithm, and constraints. Here's what each one proves and when you'll encounter it — for the full verification procedures, refer to the Proof Specification sections linked below.

**`pop-eip712`** — An EIP-712 typed-data signature from an Ethereum-compatible wallet. The subject signs a structured message binding itself to an authorized entity for a declared purpose. Used for identity binding when the subject controls an EVM account.
Spec: [Proof Specification §5.3.3](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-proofs.md)

**`pop-jws`** — A compact JSON Web Signature (JWS). Used for non-EVM signers (PGP, SSH, Ed25519, etc.). The subject's key signs a JWS with claims identifying the subject, controller, and purpose.
Spec: [Proof Specification §5.3.2](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-proofs.md)

**`x402-receipt`** — A service receipt from the x402 protocol proving that the service acknowledged payment and attested to successful delivery. The highest-confidence commercial interaction proof — it proves the reviewer actually paid for and received the service.
Spec: [Proof Specification §5.3.4](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-proofs.md)

**`x402-offer`** — A signed offer from the x402 protocol proving that a service committed to specific commercial terms before payment. Does not prove payment or delivery — only that the offer was made.
Spec: [Proof Specification §5.3.8](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-proofs.md)

**`evidence-pointer`** — A URL pointing to a publicly accessible evidence artifact. The evidence can be an embedded cryptographic proof or a handle-link statement (`v=1;controller=<DID>`). Used for non-signer identifiers (social handles, DNS names) where the trust anchor is location control rather than a signature.
Spec: [Proof Specification §5.3.5](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-proofs.md)

**`tx-encoded-value`** — A deterministic micro-transfer proof. The subject proves intent by transferring a precisely computed amount of native asset to the Controller address. The amount is derived from a canonical seed so verifiers can recompute and match it independently. Used when the subject can send transactions but can't produce arbitrary signatures.
Spec: [Proof Specification §5.3.6](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-proofs.md)

**`tx-interaction`** — Evidence that a reviewer submitted a transaction to a service's smart contract. Proves on-chain interaction but not service delivery. The on-chain analogue of an "I called this API" confirmation.
Spec: [Proof Specification §5.3.7](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-proofs.md)

### Multiple Proofs

An attestation may include multiple proofs — redundant, complementary, or for different verification pathways. The specification does not define a single global evaluation rule for multiple proofs. Consumers must apply the attestation-specific proof requirements and may use local policy to determine whether a failed proof invalidates the attestation or is ignored.

## Step 3: Trust Model Application

After structural validation and proof verification, apply your trust model:

- **Proofs present and valid**: The attestation qualifies for proof-based (trustless) trust. The consumer has independently verified the claims.
- **Proofs absent or empty**: The attestation may still be valid under trusted-attester validation. Check the attester against your allowlist or trust policy. For attestation types that don't carry proofs (Endorsements, Certifications, Security Assessments, Controller Witness), this is the primary trust model.
- **Some proofs valid, others failed**: Consumer policy decides.

No field inside an attestation can self-declare trusted status. Trusted acceptance depends solely on local trust policy and attester allowlists. See [Reputation Specification §5.1](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-reputation.md) for the formal trust model definitions.

### Controller Witness Verification

Controller Witness attestations carry no proofs — trust derives entirely from the witness identity. Consumers verify them by confirming structural validity, checking the witness attester against their trust policy, and choosing an assurance mode (temporal proof mode or common-control mode). See [Reputation Specification §6.3.4](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-reputation.md) for the full verification rules.

## Common Verification Patterns

### Pattern 1: Key Binding + Controller Witness

The standard identity verification pattern:

1. Subject publishes a Key Binding attestation binding their wallet to their `did:web`
2. Subject publishes controller evidence (DNS TXT record or `did.json`)
3. A witness server observes the evidence and issues a Controller Witness attestation
4. Consumer checks for both: Key Binding proves the key is authorized, Controller Witness proves the offchain assertion existed at a known time

### Pattern 2: Verified User Review

For high-confidence user feedback:

1. User interacts with a service via x402 and receives a signed receipt
2. User creates a User Review attestation including the `x402-receipt` as a proof
3. Consumer fetches the review, verifies the receipt, confirms the receipt's service DID matches the review's `subject`
4. The review is classified as "verified" — the reviewer demonstrably used the service

### Pattern 3: Security Assessment Check

Before trusting a DeFi protocol or API:

1. Query attestations for the subject DID
2. Filter for Security Assessment types
3. Check `assessmentKind`, `outcome`, and `metrics` in the payload
4. Verify the attester is a reputable auditor (trusted-attester validation)
5. Check `expiresAt` to ensure the assessment is current

## Further Reading

- [Reputation Model](/reputation/reputation-model) — How reputation works in OMATrust
- [Attestation Types](/reputation/attestation-types) — Schema overview for each type
- [Trust Scoring](/reputation/trust-scoring) — Guidance on building scoring logic
- [SDK Quick Verification](/sdk/guides#quick-verification) — The two-call SDK path

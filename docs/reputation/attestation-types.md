---
title: Attestation Types
---

# Attestation Types

OMATrust defines structured EAS schemas for different attestation purposes. Each schema is registered on-chain and has a canonical JSON Schema definition in the [rep-attestation-tools repository](https://github.com/oma3dao/rep-attestation-tools-evm-solidity/tree/main/schemas-json).

All attestation types share common patterns:
- `attester` — DID of the entity making the attestation (populated by EAS from the signer)
- `subject` — DID of the entity being attested about
- `issuedAt` — Unix timestamp when the attestation was created
- Timestamps use Unix seconds format

For the formal schema definitions and proof integration, see the [Reputation Specification](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-reputation.md) and [Proof Specification](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-proofs.md).

---

## Key Binding

Binds a cryptographic key to a DID. Supports multi-purpose bindings, rotation, and revocation.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `subject` | DID | Yes | DID to which this key is bound |
| `keyId` | DID | Yes | DID representing the key (`did:key`, `did:pkh`, or `did:web`) |
| `publicKeyJwk` | object | Conditional | JWK-formatted public key. Required unless `keyId` is self-certifying (`did:key` or `did:pkh:eip155`) |
| `keyPurpose` | string[] | Yes | Permitted purposes: `authentication`, `assertionMethod`, `keyAgreement`, `capabilityInvocation`, `capabilityDelegation` |
| `proofs` | Proof[] | Yes | Cryptographic proofs demonstrating control. Use `proofPurpose: 'shared-control'` |
| `issuedAt` | integer | Yes | Unix timestamp |
| `effectiveAt` | integer | No | When the binding becomes effective |
| `expiresAt` | integer | No | When the binding expires |

Key Binding attestations support the [Controller Witness](/api/controller-witness) flow — after publishing a Key Binding, a witness server can observe the offchain controller assertion and anchor it permanently.

---

## Controller Witness

A witness attestation anchoring that, at a specific time, the controller of a subject DID was asserted via a mutable offchain method (DNS TXT or DID document). The witness identity is the EAS attester address.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `subject` | DID | Yes | The DID identity (typically `did:web`) of the entity authorizing the controller |
| `controller` | DID | Yes | The controller identity (`did:pkh`, `did:key`, or `did:handle`) |
| `method` | enum | Yes | How the witness observed the assertion: `dns-txt`, `did-json`, `social-profile`, or `manual` |
| `observedAt` | integer | Yes | Unix timestamp when the witness observed the controller assertion |

See the [Controller Witness API](/api/controller-witness) for the full verification flow.

---

## Linked Identifier

Asserts that a subject controls a linked identifier, creating a symmetric DID-to-DID link. A trusted third party (the attester) verifies the linkage.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `subject` | DID | Yes | DID initiating the link (`did:pkh`, `did:web`, `did:handle`, `did:key`) |
| `linkedId` | DID | Yes | DID being linked to (`did:handle`, `did:web`, `did:pkh`, `did:key`) |
| `method` | string | Yes | Verification method: `proof`, `http-file`, `dns-txt`, `email-challenge`, `social-post`, `manual`, `oauth` |
| `proofs` | Proof[] | Conditional | Required when `method` is `proof`. Cryptographic proofs of control. Use `proofPurpose: 'shared-control'` |
| `issuedAt` | integer | Yes | Unix timestamp |
| `effectiveAt` | integer | No | When the link becomes effective |
| `expiresAt` | integer | No | When the link expires |

Supported `did:handle` platforms include Twitter, GitHub, Discord, Telegram, Lens, and Farcaster.

---

## User Review

A structured 1–5 star review of a service or application. Designed for on-chain attestation with optional proof-of-interaction.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `subject` | DID | Yes | DID of the service being reviewed |
| `version` | string | No | Version of the reviewed subject |
| `ratingValue` | integer | Yes | Rating from 1 (worst) to 5 (best) |
| `reviewBody` | string | No | Free-form text (max 500 chars) |
| `screenshotUrls` | string[] | No | Up to 10 screenshot URLs |
| `proofs` | Proof[] | Yes | Proofs demonstrating the reviewer used the service. Use `proofPurpose: 'commercial-tx'` for x402-based proof of interaction |

User reviews with x402 signed receipts as proofs provide verifiable evidence that the reviewer actually transacted with the service. See the [x402 Integration](/integrations/x402-integration) for details.

---

## User Review Response

A response from a service owner or representative to a User Review attestation. References the original review via `refUID`.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `subject` | DID | No | DID of the original reviewer being responded to |
| `refUID` | string | Yes | The EAS UID of the User Review being responded to |
| `responseBody` | string | Yes | Free-form response text (max 500 chars) |
| `issuedAt` | integer | Yes | Unix timestamp |

---

## Security Assessment

Records a security assessment (pentest, audit, code review, vulnerability scan) on-chain.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `subject` | DID | Yes | DID of the assessed service or contract |
| `organization` | DID | No | Parent organization DID (when assessing a sub-resource) |
| `version` | string | No | Software version assessed |
| `payload` | object | Yes | Assessment details (see below) |
| `payloadVersion` | string | Yes | Version of the payload schema |
| `issuedAt` | integer | Yes | Unix timestamp |
| `effectiveAt` | integer | No | When the assessment becomes effective |
| `expiresAt` | integer | No | When the assessment expires |

The `payload` object contains:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `assessmentKind` | string | Yes | Category: `pentest`, `security-audit`, `code-review`, `vulnerability-scan` |
| `reportURI` | string | No | URL to the human-readable report |
| `reportDigest` | object | No | Hash of the report for integrity verification |
| `outcome` | object | No | Assessment outcome |
| `metrics` | object | No | Finding counts by severity (critical, high, medium, low, info) |

---

## Certification

Issued by certification bodies when a subject passes a certification program.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `subject` | DID | Yes | DID of the entity being certified |
| `organization` | DID | No | Parent organization DID |
| `programID` | DID | Yes | DID of the certification program (version included in DID) |
| `assessor` | DID | Yes | DID of the authorized assessor or test lab |
| `version` | string | No | Software version certified |
| `certificationLevel` | string | No | Classification level (e.g., "Gold", "Level 2") |
| `outcome` | object | No | Certification outcome |
| `reportURI` | string | No | URL to the certification report |
| `reportDigest` | object | No | Hash of the report |
| `issuedAt` | integer | Yes | Unix timestamp |
| `effectiveAt` | integer | No | When the certification becomes effective |
| `expiresAt` | integer | No | When the certification expires |

---

## Endorsement

A lightweight attestation indicating support, trust, or approval for a subject.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `subject` | DID | Yes | DID of the entity being endorsed |
| `organization` | DID | No | Parent organization DID |
| `version` | string | No | Version of the endorsed subject |
| `policyURI` | string | No | URI to the criteria or process used for formal approvals |
| `issuedAt` | integer | No | Unix timestamp |
| `effectiveAt` | integer | No | When the endorsement becomes effective |
| `expiresAt` | integer | No | When the endorsement expires |

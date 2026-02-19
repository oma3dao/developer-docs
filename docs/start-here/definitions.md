---
title: Definitions
---

# Definitions

This page defines the key terms used throughout the OMATrust developer documentation. Terms are grouped by category — start with the common terms, then refer to the technical sections as needed.

## Common Terms

| Term | Definition |
|------|-----------|
| Attestation | A structured, signed statement made by one identity about another. For example, "this auditor attests that this service passed a security review." Attestations are the building blocks of reputation in OMATrust. |
| Attester | The entity that creates and signs an attestation. Could be a security auditor, a user writing a review, a witness server, or a certification body. The W3C DID specs use "Issuer" for the same role. |
| Issuer | Same as Attester. Used in W3C DID specifications. Both terms appear in the OMATrust specs interchangeably. |
| Subject | The entity being attested about — the target of the claim. Typically a service (`did:web`), smart contract (`did:pkh`), or organization. |
| Consumer | Software or an entity that queries OMATrust attestations to make trust decisions. Could be a frontend app, an AI agent, an indexer, or a smart contract. The OMATrust specs use "Client" for this role. |
| Client | Same as Consumer. The primary term used in the OMATrust specifications. |
| Verifier | Same as Consumer, but emphasizes the verification aspect — checking proofs, validating signatures, confirming attestation integrity. Used in W3C DID specifications. |
| Service | An internet-facing application, API, website, smart contract, or agent. OMATrust reputation is about services, not end-users. |
| DID | Decentralized Identifier. A globally unique identifier that doesn't depend on a central authority. Follows the [W3C DID standard](https://www.w3.org/TR/did-core/). Examples: `did:web:example.com`, `did:pkh:eip155:1:0xABC...`. |
| Reputation | The aggregate of all attestations associated with a subject DID. Not a single score — it's the collection of verifiable trust signals that consumers interpret according to their own logic. |

## Identity Terms

| Term | Definition |
|------|-----------|
| did:web | A DID method that uses a web domain as the identifier. `did:web:example.com` resolves to a DID document hosted at `https://example.com/.well-known/did.json`. Commonly used for services and organizations. |
| did:pkh | A DID method derived from a blockchain account address. `did:pkh:eip155:1:0xABC...` represents an Ethereum address. Used for smart contracts and wallets. |
| did:handle | A DID method representing a social platform handle. `did:handle:twitter:alice` represents a Twitter account. Used for cross-platform identity linking. |
| did:key | A DID method where the identifier is a public key itself. Self-certifying — the DID encodes the key directly. |
| Linked Identifier | A Support Attestation asserting that two DIDs are controlled by the same entity. Used for cross-platform identity linkage. |
| Key Binding | A Support Attestation declaring that a specific cryptographic key is authorized to act on behalf of a subject DID. Includes lifecycle management (rotation, expiration, revocation). |
| Controller Witness | A Support Attestation from a third-party witness anchoring a timestamped observation that a subject asserted a particular controller via mutable offchain state (DNS, DID document, social profile). |
| Support Attestation | An attestation that establishes identity relationships (Linked Identifier, Key Binding, Controller Witness). These are the foundation that Reputation Attestations depend on. |
| Reputation Attestation | An attestation that carries a trust signal about a service (User Review, Endorsement, Certification, Security Assessment). |
| Authorization Set | The set of public keys that a service has published or attested as authorized to sign on its behalf. |

## Proof Terms

| Term | Definition |
|------|-----------|
| Proof | A structured JSON object that carries or references cryptographic evidence supporting an attestation. Proofs are not attestations — they are evidence objects attached to attestations. |
| Proof Object | The native cryptographic artifact inside a proof (e.g., a JWS string, an EIP-712 signature bundle, an x402 receipt). Format depends on the proof type. |
| Proof Type | Identifies how a proof is constructed and verified. Determines the evidence format, required fields, and verification algorithm. Values: `pop-eip712`, `pop-jws`, `x402-receipt`, `x402-offer`, `evidence-pointer`, `tx-encoded-value`, `tx-interaction`. |
| Proof Purpose | Declares why a proof exists and what level of assurance it provides. `shared-control` is used for identity binding (higher assurance). `commercial-tx` is used for commercial interactions (lower friction). |
| Proof Wrapper | The standard JSON envelope around a proof object. Contains `proofType`, `proofObject`, and optionally `proofPurpose`, `version`, `issuedAt`, `expiresAt`. |
| Signer-Capable Identifier | An identifier bound to a cryptographic key that can produce digital signatures (e.g., EVM wallets, `did:key`). Can use signature-based proof types. |
| Non-Signer Identifier | An identifier with no associated signing key (e.g., social handles, DNS names). Must use location-based proof mechanisms like `evidence-pointer`. |
| Verified Review | A User Review attestation that includes at least one valid proof demonstrating service usage or reviewer identity. |
| Unverified Review | A User Review attestation without proofs, or with proofs that fail verification. Still a valid attestation, but carries lower trust. |

## Infrastructure Terms

| Term | Definition |
|------|-----------|
| EAS | Ethereum Attestation Service ([attest.org](https://attest.org)). The primary on-chain transport for OMATrust attestations. Provides immutable, timestamped, publicly queryable attestation storage. |
| Transport | The system used to store, reference, and query attestations. EAS is the primary transport today; the attestation model is transport-independent and supports others (BAS, centralized systems, federated indexers). |
| Indexer | A system that aggregates and indexes attestations for efficient querying. Provides APIs (often GraphQL) for searching attestations by subject, attester, schema type, etc. |
| Schema | A JSON Schema (Draft 2020-12) definition that describes the structure, constraints, and validation rules for an attestation type. Published in the [OMA3 schema repository](https://github.com/oma3dao/rep-attestation-tools-evm-solidity/tree/main/schemas-json). |
| x402 | A bidirectional, payment-linked protocol for exchanging signed messages between client and server. Generates mutually verifiable usage proofs (receipts and offers) used in User Review attestations. |
| JCS | JSON Canonicalization Scheme (IETF RFC 8785). Used to produce deterministic JSON representations for hashing and signing. |
| CAIP-2 | Chain Agnostic Improvement Proposal 2. A standard for identifying blockchain networks (e.g., `eip155:1` for Ethereum mainnet, `eip155:66238` for OMAChain Testnet). |
| Delegated Attestation | An attestation where the attester signs the data but a relayer submits the transaction on-chain and pays gas. Useful for end users who don't want to manage gas. |
| Payload Container | A shared pattern used by Endorsement, Certification, and Security Assessment attestations. Carries evolvable details in a `payload` object with optional `payloadVersion`, `payloadSpecURI`, and `payloadSpecDigest` for schema versioning and integrity. |

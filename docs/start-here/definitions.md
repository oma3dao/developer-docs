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
| DID Address | A 20-byte deterministic lookup key derived from a DID, used as the EAS `recipient` field for on-chain attestation indexing. Not a real wallet address. See [full definition](#did-address). |
| Reputation | The aggregate of all attestations associated with a subject DID. Not a single score — it's the collection of verifiable trust signals that consumers interpret according to their own logic. |

## DID Address {#did-address}

A DID Address is a 20-byte value derived from a DID. It is used as the EAS `recipient` field for on-chain attestation indexing. It is **not** a real wallet address — it is a deterministic lookup key.

**Derivation pipeline:**

```
DID → normalize → keccak256 → 32-byte hash → last 20 bytes → DID Address
```

For example, `did:web:example.com` is normalized, hashed with keccak256 to produce a 32-byte digest, and then the low-order 160 bits (last 20 bytes) are taken as the DID Address.

For `did:web`, normalization uses the canonical hostname form before hashing. That includes:

- lowercasing the host
- trimming surrounding whitespace
- removing a trailing `.`
- stripping a leading `www.`

So `did:web:www.example.com` and `did:web:example.com` produce the same DID Address.

**SDK functions:**

| Function | Input | Description |
|----------|-------|-------------|
| `didToAddress(did)` | A DID string | Runs the full pipeline: normalize → hash → truncate |
| `computeDidHash(did)` | A DID string | Returns the 32-byte keccak256 hash (intermediate step) |
| `computeDidAddress(didHash)` | A 32-byte hash | Truncates to the last 20 bytes (final step) |

`didToAddress` and `computeDidAddress` produce the same result for the same DID — they are different entry points into the same pipeline.

**Why both `recipient` and `subject`?** OMATrust attestation schemas store the full DID string in a `subject` field (for human readability and verification) and the derived DID Address in the EAS `recipient` field (for efficient on-chain indexing). The DID Address is what makes attestations queryable by subject on EAS.

See [OMATrust Identity Specification §5.3.2](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-identity.md) for the formal definition, and the [Identity SDK Reference](/sdk/api-reference/identity-sdk#hashing-and-address) for function signatures.

## Identity Terms

| Term | Definition |
|------|-----------|
| Subject DID | The DID of the entity being attested about. Always a **bare DID** (no fragment). Typically `did:web:example.com` for services or `did:pkh:eip155:1:0xABC...` for smart contracts. Subject DIDs are mutable references — the entity behind them can change keys, rotate controllers, or update their DID document. |
| Controller DID | The DID of the entity authorized to act on behalf of a subject. A controller DID is always a **private-key DID** — it represents a specific cryptographic key. Two forms: `did:pkh:eip155:<chainId>:<address>` for EVM wallets, and `did:jwk:<base64url-encoded-public-key>` for non-EVM keys. Controller DIDs are the **immutable identity** in the system — they are derived directly from key material and cannot change. |
| DID URL | A DID with a fragment (e.g., `did:web:api.example.com#key-1`). A DID URL is a **mutable key reference** — it points to a verification method in a DID document, but the key at that location can change if the document is updated. DID URLs are not controller DIDs. To get the durable controller identity from a DID URL, resolve it to its public key and derive a `did:jwk`. See [DID URL vs Controller DID](#did-url-vs-controller-did). |
| did:web | A DID method that uses a web domain as the identifier. `did:web:example.com` resolves to a DID document hosted at `https://example.com/.well-known/did.json`. Commonly used for services and organizations. |
| did:pkh | A DID method derived from a blockchain account address. `did:pkh:eip155:1:0xABC...` represents an Ethereum address. Used for smart contracts and wallets. |
| did:jwk | A DID method where the identifier is a base64url-encoded public JWK. Self-certifying and immutable — the DID encodes the key material directly. Used as the durable controller identity for non-EVM keys. |
| did:handle | A DID method representing a social platform handle. `did:handle:twitter:alice` represents a Twitter account. Used for cross-platform identity linking. |
| did:key | A DID method where the identifier is a public key itself. Self-certifying — the DID encodes the key directly. |
| Linked Identifier | A Support Attestation asserting that two DIDs are controlled by the same entity. Used for cross-platform identity linkage. |
| Key Binding | A Support Attestation declaring that a specific cryptographic key is authorized to act on behalf of a subject DID. Includes lifecycle management (rotation, expiration, revocation). |
| Controller Witness | A Support Attestation from a third-party witness anchoring a timestamped observation that a subject asserted a particular controller via mutable offchain state (DNS, DID document, social profile). The `subject` field is the DID being pinned (mutable reference), and the `controller` field is the `did:jwk` or `did:pkh` (immutable key material). |
| Support Attestation | An attestation that establishes identity relationships (Linked Identifier, Key Binding, Controller Witness). These are the foundation that Reputation Attestations depend on. |
| Reputation Attestation | An attestation that carries a trust signal about a service (User Review, Endorsement, Certification, Security Assessment). |
| Authorization Set | The set of public keys that a service has published or attested as authorized to sign on its behalf. |

## DID URL vs Controller DID {#did-url-vs-controller-did}

A DID URL like `did:web:api.example.com#key-1` is a **mutable key reference**. It points to a verification method in a DID document, but the key at that location can change if the document owner updates it. This makes DID URLs unsuitable as durable controller identities.

The **controller DID** is always derived from the key material itself:

- For EVM keys: `did:pkh:eip155:<chainId>:<address>` — derived from the secp256k1 public key
- For non-EVM keys: `did:jwk:<base64url-encoded-JWK>` — encodes the public key directly

**Resolution flow:** When you have a DID URL (e.g., from a JWS `kid` header), resolve it to the actual public key, then derive the durable controller DID:

```ts
import { resolveDidUrlToControllerDid } from "@oma3/omatrust/identity";

// DID URL → resolve → extract publicKeyJwk → derive did:jwk
const resolved = await resolveDidUrlToControllerDid("did:web:api.example.com#key-1");
// resolved.controllerDid = "did:jwk:eyJrdHkiOiJFQyIs..."
```

The `controllerDid` is what you pass to `getControllerAuthorization`. The DID URL is what gets recorded in Controller Witness attestations as the subject (the mutable reference being pinned at a point in time).

**Authorization flow after JWS verification:**

```ts
import { extractAuthorizationMetadata } from "@oma3/omatrust/identity";
import { getControllerAuthorization } from "@oma3/omatrust/reputation";

// 1. Verify JWS → get JwsVerificationResult with publicKeyDid (the did:jwk)
// 2. Extract metadata for authorization check
const meta = extractAuthorizationMetadata(jwsVerificationResult);
// meta = { controllerDid, subjectDid, resourceUrl, issuedAt, kid, publicKeyJwk }

// 3. Check authorization window
const auth = await getControllerAuthorization({
  controllerDid: meta.controllerDid,
  subjectDid: meta.subjectDid,
  provider,
});
```

**Controller ID comparison** uses `isSameControllerId()` which handles three matching strategies:
1. Exact normalized DID string match
2. EVM address match (chain-agnostic) — `did:pkh:eip155:1:0xABC` matches `did:pkh:eip155:137:0xABC`
3. JWK material match — two `did:jwk` with the same key material but different encodings

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

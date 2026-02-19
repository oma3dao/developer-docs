---
title: ERC-8004 Integration
---

# ERC-8004 Integration

ERC-8004 is an Ethereum standard for tokenizing AI agents as ERC-721 NFTs. Each token represents a verifiable identity for an agent or agent API.

The OMATrust App Registry is based on ERC-8004 with additional extensions. The App Registry is currently undergoing audit planning.

## How ERC-8004 Relates to OMATrust

ERC-8004 provides a standardized way to register, identify, and give feedback on internet services on-chain. OMATrust's reputation layer extends ERC-8004 with attestations (user reviews, security assessments, endorsements, certifications).

## ERC-8004 Extensions

Three extensions are being developed to expand ERC-8004's capabilities. One is currently under review as a [pull request on the ERC-8004 repository](https://github.com/erc-8004/erc-8004-contracts/pull/20).

The next sections describes features these extensions provide.

### Security & Ownership Verification

Adds metadata integrity tracking and ownership confirmation:

- **dataHash** — Keccak-256 hash of the JCS-canonicalized Registration File, stored on-chain for tamper detection
- **Semantic versioning** — `MAJOR.MINOR.PATCH` version tracking with on-chain enforcement of monotonic increases
- **Ownership verification** — Links the NFT owner to the Registration File via DNS TXT records or an `owner` field

### Web Services Trust Layer

Generalizes ERC-8004 beyond AI agents to any online service:

- **Interface bitmap** — Categorizes services as Human (websites, apps), API (REST, GraphQL, MCP), or Smart Contract (DeFi, DAOs), with bitwise combinations
- **Traits** — Keyword arrays (stored as keccak-256 hashes on-chain) for discoverability: `api:mcp`, `api:openapi`, `pay:x402`, etc.
- **Artifacts** — Content-addressable verification of downloadable binaries using `did:artifact:<cidv1>` identifiers
- **contractId** — CAIP-10 identifier for smart contract services, with on-chain ownership verification

### EAS Integration

Defines how to map ERC-8004 identities to Ethereum Attestation Service (EAS) for attestation indexing:

- **DID Address** — A 20-byte value derived from truncating `keccak256(canonicalDID)`, used as the EAS `recipient` field for efficient querying
- **Schema design** — Attestation schemas include both `recipient` (DID Address for indexing) and `subject` (full DID string for verification) to prevent spoofing
- **Migration path** — v1 uses DID Address as a compatibility bridge with EAS's address-typed recipient field; v2 will support native non-address subject types

## Further Reading

- [ERC-8004 Extensions PR](https://github.com/erc-8004/erc-8004-contracts/pull/20) — Security, Web Services, and EAS extension specs under review
- [ERC-8004 Base Specification](https://github.com/erc-8004/erc-8004-contracts/blob/master/ERC8004SPEC.md) — The formal standard
- [App Registry Overview](/app-registry/overview) — The OMATrust App Registry built on ERC-8004
- [Reputation Model](/reputation/reputation-model) — How attestations work

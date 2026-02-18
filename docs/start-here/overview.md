---
title: Overview
slug: /
---

# OMATrust Developer Documentation

:::caution Draft Documentation
This documentation is in **draft format** and under active development. Information may be incomplete, contain errors, or change as the protocol evolves. Please verify critical details against the [OMATrust Specifications](https://github.com/oma3dao/omatrust-docs/tree/main/specification).
:::

**The Trust Layer for the Open Internet**

OMATrust is a decentralized verification protocol that brings the security and reliability of curated app stores to the entire internet. Register your websites, APIs, MCP servers, A2A agents, and smart contracts to make them discoverable and verifiable through cryptographic attestations.

**Learn More:**
- 📄 [OMATrust Whitepaper](https://github.com/oma3dao/omatrust-docs/blob/main/whitepaper/omatrust-whitepaper.md) - Vision, economics, and the future of internet trust
- 📋 [OMATrust Identity Specification](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-identity.md) - Application registry, DID ownership, and metadata formats
- 🔐 [OMATrust Proof Specification](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-proofs.md) - Cryptographic proofs for attestations
- ⭐ [OMATrust Reputation Specification](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-reputation.md) - Attestation schemas and reputation system

## The Problem

The internet lacks a universal trust layer. Current trust mechanisms are fragmented:

- **SSL certificates** only prove domain ownership, not legitimacy or security
- **Audits and certifications** live in PDFs that can't be programmatically verified
- **Reputation systems** are siloed inside centralized platforms (Apple App Store, Amazon reviews)
- **APIs and smart contracts** have no standard way to establish trust

The lack of trust on the open internet has led to some of the biggest hacks in history, but as AI agents begin transacting at scale the problem becomes much worse: agents can't evaluate trust the way humans do. They need **machine-verifiable proof**.

## The Solution: OMATrust

OMATrust provides three core primitives:

### 1. **App Registry** - Verifiable Identity

Tokenize your service as an on-chain NFT with metadata:
- **Websites** - Provide tamper-proof trust information on your service
- **APIs** - Publish endpoint metadata (OpenAPI, GraphQL, JSON-RPC, MCP, A2A)- OMATrust is the app store for APIs
- **Smart Contracts** - Establish provenance and cryptographically link audits
- **Downloadable Binaries** - Give users the same amount of trust in internet binaries as they have in app store binaries

Each registration creates a permanent, unique identifier that can be referenced across the internet.

### 2. **Attestations** - Cryptographic Proof

Independent auditors, issuers, and oracles publish verifiable attestations:
- **Security audits** - Code reviews, penetration testing
- **Compliance certifications** - GDPR, SOC2, industry standards
- **Official Endorsements** - Checkmarks from trustworthy institutions
- **User reviews** - Structured feedback from users

Attestations are stored cross-chain and cryptographically linked to registry identities.

### 3. **Verification** - Instant Trust Checks

Clients (humans or AI agents) can instantly verify a service using its registry identity:
```typescript
// Check if a service is registered and has valid attestations
const trustScore = await verifyService('did:web:example.com');
if (trustScore.hasSecurityAudit && trustScore.uptime > 99.9) {
  // Safe to use!
}
```

## Why It Matters

**For Developers:**
- Build reputation that is not locked in walled gardens
- Increase discoverability of your services
- Resist censorship of centralized marketplaces

**For Users:**
- Verify services before using them
- See real audits, not fake badges
- Protect against malicious attacks

**For AI Agents:**
- Programmatically verify legitimacy
- Access machine-readable trust data
- Operate safely at scale

## Key Innovations

### Cross-Chain Architecture

OMATrust is designed to be cross-chain:
- **OMAchain Testnet** (primary coordination layer)
- **Ethereum ecosystem, Solana, MOVE** (coming soon)
- OMAChain deduplication ensures one canonical entry per service

### DID-Based Identity

Uses W3C Decentralized Identifiers:
- `did:web:example.com` - Domain-based identity
- `did:pkh:eip155:1:0xAddress` - Blockchain-based identity

### Metadata Flexibility

Store metadata on-chain or off-chain:
- On-chain: Immutable, gas-intensive
- Off-chain with hash: Efficient, verifiable via dataHash

### Attestation Framework

Built on Ethereum Attestation Service (EAS) for EVM chains:
- Cryptographically signed
- Timestamped on-chain
- Queryable by schema

Support for other virtual machines and ecosystems is coming soon.

## What You Can Register

| Type | Example | Use Case |
|------|---------|----------|
| **Website** | `did:web:store.example.com` | E-commerce site verification |
| **Online Game** | `did:web:game.example.com` | Downloadable binary verification |
| **REST API** | `did:web:api.example.com` | Service discovery & trust |
| **GraphQL API** | `did:web:graphql.example.com` | Schema verification |
| **MCP Server** | `did:web:mcp.example.com` | AI agent integration |
| **A2A Agent** | `did:web:agent.example.com` | Agent-to-agent trust |
| **Smart Contract** | `did:pkh:eip155:1:0xAddress` | On-chain provenance |

## Quick Start

### 1. Choose Your DID & Verify Ownership

Pick a Decentralized Identifier (DID) for your service:

**did:web (Domain-based)** - For services with domains
- Format: `did:web:example.com`
- Verification: DNS TXT entry or DID document at `/.well-known/did.json`
- Best for: Websites, APIs, SaaS services

**did:pkh (Blockchain-based)** - For smart contracts
- Format: `did:pkh:eip155:1:0xContractAddress`
- Verification: Prove you control the contract
- Best for: DeFi, NFTs, DAOs

[Learn about DID verification →](/app-registry/registration-guide#step-3-verification--interface-selection)

### 2. Connect & Register

Visit [registry.omatrust.org](https://registry.omatrust.org), click "Get Started", and choose interface type(s):
- **Human** - Websites and apps with UI
- **API** - Programmatic services (REST, GraphQL, MCP, A2A, JSON-RPC)
- **Smart Contract** - On-chain applications

### 3. Add Metadata

Provide interface-specific information through the wizard:
- Core info: Description, publisher, images
- Endpoints: API URLs, schemas, RPC endpoints
- Platforms: Web, mobile, desktop availability
- Advanced: MCP config, artifact verification

### 4. Collect Attestations

Encourge your ecossytem to visit [reputation.oma3.org](https://reputation.oma3.org) to build trust:
- Submit security audits
- Collect user reviews
- Publish compliance certifications

## Architecture at a Glance

```
┌─────────────────────────────────────────────────┐
│  Clients (Users, AI Agents, Apps)               │
│  Query registry + attestations for trust data   │
└─────────────────┬───────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
┌───────▼────────┐   ┌──────▼─────────┐
│  App Registry  │   │  Attestations  │
│  (NFTs)        │   │  (EAS Schemas) │
└───────┬────────┘   └───────┬────────┘
        │                    │
        └─────────┬──────────┘
                  │
        ┌─────────▼──────────┐
        │  OMAchain Testnet  │
        │  (Coordination)    │
        └────────────────────┘
```

## Next Steps

- **[What is a Tokenized Service?](/app-registry/erc8004-compatibility)** - Understand the data model
- **[Registration Guide](/app-registry/registration-guide)** - Step-by-step walkthrough
- **[Client Integration](/reputation/consumer-workflow)** - Query and verify services
- **[Cookbooks](/app-registry/cookbooks/register-website)** - Specific use cases

---

**Ready to build trust into the open internet?** Start by registering your first service at [registry.omatrust.org](https://registry.omatrust.org).

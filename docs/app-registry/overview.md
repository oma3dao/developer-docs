---
title: App Registry Overview
---

# App Registry Overview

:::caution Preview
The App Registry is in preview and is not yet production-ready. APIs and data structures may change.
:::

The OMATrust App Registry is an ERC-8004-compliant identity registry that tokenizes internet services as on-chain NFTs. Each registration creates a permanent, verifiable identifier for a website, API, smart contract, or AI agent.

## What You Can Register

| Type | DID Format | Use Case |
|------|-----------|----------|
| Website | `did:web:store.example.com` | E-commerce site verification |
| Online Game | `did:web:game.example.com` | Downloadable binary verification |
| REST API | `did:web:api.example.com` | Service discovery and trust |
| GraphQL API | `did:web:graphql.example.com` | Schema verification |
| MCP Server | `did:web:mcp.example.com` | AI agent integration |
| A2A Agent | `did:web:agent.example.com` | Agent-to-agent trust |
| Smart Contract | `did:pkh:eip155:1:0xAddress` | On-chain provenance |

## How It Works

Each registration mints an ERC-721 NFT with standardized metadata. The token represents a verifiable identity that can be referenced across the internet and linked to attestations in the reputation layer.

### DID-Based Identity

The registry uses W3C Decentralized Identifiers:
- `did:web:example.com` — Domain-based identity for services with domains
- `did:pkh:eip155:1:0xAddress` — Blockchain-based identity for smart contracts

### Interface Types

When registering, you choose one or more interface types:
- **Human** — Websites and apps with UI
- **API** — Programmatic services (REST, GraphQL, MCP, A2A, JSON-RPC)
- **Smart Contract** — On-chain applications

### Metadata Storage

Metadata can be stored on-chain or off-chain:
- On-chain: Immutable, gas-intensive
- Off-chain with hash: Efficient, verifiable via `dataHash`

## Registration Flow

1. **Choose your DID and verify ownership** — Pick `did:web` (domain-based) or `did:pkh` (blockchain-based) and prove control
2. **Connect and register** — Visit [registry.omatrust.org](https://registry.omatrust.org) and select your interface types
3. **Add metadata** — Provide descriptions, endpoints, schemas, and platform info through the wizard
4. **Build trust** — Optionally collect attestations (audits, reviews, certifications) via the [Reputation System](/reputation/attestation-types)

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Clients (Users, AI Agents, Apps)               │
│  Query registry for service identity & metadata │
└─────────────────┬───────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
┌───────▼────────┐   ┌──────▼─────────┐
│  App Registry  │   │   Resolver     │
│  (ERC-721)     │   │  (Ownership &  │
│                │   │   DataHash)    │
└───────┬────────┘   └───────┬────────┘
        │                    │
┌───────▼────────┐           │
│   Metadata     │           │
│  (On-chain)    │           │
└───────┬────────┘           │
        └─────────┬──────────┘
                  │
        ┌─────────▼──────────┐
        │  OMAchain Testnet  │
        └────────────────────┘
```

## Next Steps

- [What is a Tokenized Service?](/app-registry/erc8004-compatibility) — Understand the ERC-8004 data model
- [Registration Guide](/app-registry/registration-guide) — Step-by-step walkthrough
- [Cookbooks](/app-registry/cookbooks/register-website) — Register specific service types
- [Registry SDK Reference](/app-registry/registry-sdk-reference) — Programmatic access

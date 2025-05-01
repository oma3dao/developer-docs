---
id: overview
title: Overview
slug: /
sidebar_position: 1
---

# App Registry Overview

The OMA3 Application Registry is a **blockchain-based, permissionless registry of applications** designed to replace centralized app store databases. Instead of relying on proprietary app store servers, this registry enables anyone to **mint an application token**, which can then be displayed and launched by compatible apps and websites.

<div style={{textAlign: 'center'}}>
<img src="/img/diagrams/oma3-app-tokenization.png" width="400" alt="OMA3 App Tokenization" />
</div>

## Purpose of the Registry

The App Registry serves as a permissionless, decentralized alternative to traditional app store backends. It allows:

- **Open publishing** - Any developer can mint an app token without gatekeepers
- **Standardized discovery** - Common protocol for finding and listing applications
- **Interoperability** - Apps can be discovered and launched across different metaverse platforms
- **Self-sovereignty** - Developers maintain control of their app metadata and deployment

These app tokens are decentralized, discoverable, and interoperable across the open metaverse. Apps, games, and services that support the **Inter World Portaling System (IWPS)** can query these tokenized applications and present them to users through immersive storefronts, developer portals, or other interface layers.

<div style={{textAlign: 'center'}}>
<img src="/img/diagrams/oma3-spatial-store-architecture.png" width="600" alt="OMA3 Spatial Store Architecture" />
</div>

## Key Components

The decentralized app ecosystem consists of several key components that work together regardless of the specific implementation:

1. **ERC-721 Contracts** - Extensible NFT contracts that are adapted for tokenizing applications (OMA3's contract is one implementation of many possible registry contracts)
2. **Decentralized Identifiers (DIDs)** - Unique, cryptographically verifiable identifiers that securely identify applications and link them to their developers
3. **Reputation Systems** - DID-based trust mechanisms that help users evaluate app quality and security (see "Trust in a Permissionless Environment" below)
4. **Store Interfaces** - User interfaces that provide discovery and launch capabilities for the decentralized app landscape
5. **Optional Indexers** - Services that help stores efficiently track and query all the ERC-721 and reputation contracts across the ecosystem, both centralized and decentralized

These components collectively enable a vibrant, open ecosystem for application discovery and distribution without relying on centralized gatekeepers.

## Trust in a Permissionless Environment

In a permissionless registry where anyone can publish applications, establishing trust becomes crucial. Unlike centralized app stores with manual review processes, the OMA3 App Registry relies on decentralized mechanisms for building trust:

### Reputation Systems

The next major focus for app tokenization will be implementing robust reputation systems that:
- Track developer history and application quality
- Aggregate user feedback in a transparent, tamper-resistant way
- Establish reputation scores that help users make informed decisions
- Prevent Sybil attacks through identity verification

### Attestations and Credentials

The registry will support verifiable attestations that provide:
- Security audits from recognized third parties
- Code quality certifications
- Privacy compliance validations
- Age appropriateness ratings

### Credential Issuers

Specialized entities will emerge to issue credentials for applications:
- Professional security auditing organizations
- Community-governed rating bodies
- Industry certification programs
- Subject matter expert attestations

These trust mechanisms will allow the ecosystem to maintain the benefits of permissionless publishing while providing users with tools to evaluate application quality and security.

## AppFi: A New Frontier of Application Finance?

Tokenizing applications could open an entirely new paradigm we call "AppFi" - Application Finance. Once applications become tokenized assets on the blockchain, they can interact with the broader Web3 ecosystem in ways traditional applications never could.

### Potential AppFi Innovations

- **Revenue Sharing and Royalties** - Applications can programmatically distribute revenue to contributors, investors, or community members
- **Application DAOs** - Decentralized governance of application development and feature prioritization
- **App Token Fractionalization** - Allowing partial ownership of applications to democratize investment
- **Development Futures** - Investment in applications pre-launch based on developer reputation
- **Cross-App Composability** - Applications that can own and integrate with other applications as tokenized assets
- **Reputation-Based Credit** - Financing based on verifiable app performance metrics and developer history
- **Application Insurance** - Protection against exploits or downtime through decentralized insurance protocols

### Unexplored Territory

The field of AppFi represents largely unexplored territory. By establishing a standard for tokenized applications, OMA3 is creating the foundation for a wide range of financial and organizational innovations we can't yet predict. We're excited to see what the community builds on top of this infrastructure, as developers experiment with new models for funding, governing, and monetizing decentralized applications.

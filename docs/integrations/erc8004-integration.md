---
title: ERC-8004 Integration
---

# ERC-8004 Integration

ERC-8004 is an Ethereum standard for registering, identifying, and giving feedback on internet services on-chain.  It specifies an Identity Registry for tokenizing AI agents as ERC-721 NFTs. Each token represents a verifiable identity for an agent or agent API.  ERC-8004 also specifies a Reputation Registry for feedback.


## How ERC-8004 Relates to OMATrust

OMATrust interfaces with ERC-8004 in two ways:

- The OMATrust **App Registry**, which will be documented later, is an ERC-8004 Identity Registry with additional extensions. The App Registry is currently undergoing audit planning.  
- OMATrust's **reputation layer** extends ERC-8004 with attestations (user reviews, security assessments, endorsements, certifications) that leverage Ethereum Attestation Service.  These attestations provide additional trust signals to the agent economy.

## ERC-8004 EAS Extension

Three extensions are being developed to expand ERC-8004's capabilities. The first is currently under review as a [pull request on the ERC-8004 repository](https://github.com/erc-8004/erc-8004-contracts/pull/20).  It defines how to map ERC-8004 to Ethereum Attestation Service (EAS) for attestation indexing:

- **DID Address** — A 20-byte value derived from truncating `keccak256(canonicalDID)`, used as the EAS `recipient` field for efficient querying.  ERC-8004 `agentURI` identities can be expressed as a DID using the `did:web` method.
- **Schema design** — OMATrust attestation schemas utilize both `recipient` (DID Address for indexing) and `subject` (full DID string) for verification.

## Further Reading

- [ERC-8004 Base Specification](https://github.com/erc-8004/erc-8004-contracts/blob/master/ERC8004SPEC.md) — The formal standard
- [Reputation Model](/reputation/reputation-model) — How attestations work

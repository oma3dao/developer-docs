---
title: Reputation Model
---

# Reputation Model

OMATrust reputation is built on cryptographically signed attestations stored on-chain using the [Ethereum Attestation Service (EAS)](https://attest.org). Each attestation is an immutable, timestamped statement made by one identity about another.

## What is an Attestation?

An attestation is a signed claim:

```
"I, [Issuer], attest that [Subject] has [Property]"
```

For example:
- "SecureAudit Pro attests that did:web:defi.example.com passed a security assessment on 2025-01-15"
- "Alice attests that did:web:game.example.com deserves a 5-star rating"
- "OMA3 Witness attests that did:web:example.com controls did:pkh:eip155:66238:0xABC..."

Attestations are:
- Immutable — cannot be changed after issuance
- Timestamped — include issuance date from the block
- Cryptographically signed — the attester's signature proves authenticity
- On-chain — publicly queryable and verifiable by anyone

## How Reputation Works

Reputation in OMATrust is not a single score. It is the aggregate of all attestations associated with a subject DID. Consumers (humans, apps, AI agents) query attestations and apply their own trust logic.

A service with a security assessment from a reputable auditor, multiple positive user reviews with proof-of-interaction, and a key binding attestation has stronger reputation than one with no attestations at all. But OMATrust does not prescribe a formula — it provides the verifiable data.

## Attestation Lifecycle

1. An attester (auditor, user, witness, certification body) creates an attestation referencing a subject DID
2. The attestation is submitted to EAS on-chain (directly or via [delegated attestation](/api/delegated-attestation))
3. The attestation becomes queryable immediately and is permanently anchored
4. Optionally, attestations can be revoked by the original attester if circumstances change
5. Attestations may include an `expiresAt` timestamp, after which consumers should treat them as stale

## Roles

- **Attester / Issuer** — The entity making the claim. Could be an auditor, a user, a witness server, or a certification body. See [Issuer Workflow](/reputation/issuer-workflow).
- **Subject** — The DID being attested about. Typically a service (`did:web`) or smart contract (`did:pkh`).
- **Consumer** — The entity reading attestations to make trust decisions. Could be a frontend app, an AI agent, or another smart contract. See [Consumer Workflow](/reputation/consumer-workflow).

## Attestation Types

OMATrust defines structured schemas for different attestation purposes. See [Attestation Types](/reputation/attestation-types) for the full catalog, including:

- Key Binding
- Controller Witness
- Linked Identifier
- User Review and User Review Response
- Security Assessment
- Certification
- Endorsement

## Specifications

For the formal definitions of attestation schemas, proof types, and reputation logic:

- [OMATrust Reputation Specification](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-reputation.md)
- [OMATrust Proof Specification](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-proofs.md)

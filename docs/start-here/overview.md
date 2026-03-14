---
title: Overview
slug: /
---

# OMATrust Developer Documentation

OMATrust is an EAS-based reputation layer for services and agents. Verify audits, compliance certifications, endorsements, and signed receipts using machine-verifiable attestations.

```bash
npm install @oma3/omatrust
```

→ [Publish an attestation](/start-here/quickstart-publish)
→ [Verify reputation](/start-here/quickstart-verify)

## What You Can Do Today

- **Publish attestations** — Issue security audits, compliance certifications, endorsements, user reviews, or user review responses as cryptographically signed on-chain records. See the [Reputation section](/reputation/reputation-model) for details on attestation types and workflows.
- **Integrate with x402** — Use x402 signed offers and receipts as user review proof of interaction.  Learn more in the [x402 Integration Guide](/integrations/x402/overview)
- **Respond to reviews** — Publish on-chain responses to user reviews, creating a verifiable dialogue between service operators and reviewers
- **Verify a service's reputation** — Query on-chain attestations for any internet service using the [SDK](/sdk/getting-started)
- **Integrate trust checks** — Add reputation verification to your app, API, or AI agent in a few lines of code. See the [SDK API Reference](/sdk/api-reference/reputation-sdk) for function signatures.

## Who This Is For

**Auditors and issuers** — Publish verifiable security audits, compliance certifications, and endorsements that live on-chain and can't be faked. See the [Issuer Workflow](/reputation/issuer-workflow).

**Developers** — Query attestations programmatically to make trust decisions in your applications. Build reputation-aware services with the [SDK](/sdk/getting-started).

**AI agents** — Access machine-readable trust data to verify services before interacting with them. Operate safely at scale. Start with the [Consumer Workflow](/reputation/consumer-workflow).

## Learn More

- 📄 [OMATrust Whitepaper](https://github.com/oma3dao/omatrust-docs/blob/main/whitepaper/omatrust-whitepaper.md) — Vision, economics, and the future of internet trust
- ⭐ [OMATrust Reputation Specification](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-reputation.md) — Attestation schemas and reputation system
- 🔐 [OMATrust Proof Specification](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-proofs.md) — Cryptographic proofs for attestations
- 📋 [OMATrust Identity Specification](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-identity.md) — Application registry, DID ownership, and metadata formats

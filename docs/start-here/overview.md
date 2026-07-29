---
title: Overview
slug: /
---

# OMATrust Developer Documentation

OMATrust is a reputation layer for services and agents. It supports audits, compliance certifications, endorsements, and signing key authorizations using machine-verifiable attestations.

## Get Started

Choose your path:

| | Path | Best for |
|---|---|---|
| 🖥️ | **[Use the OMATrust Portal](/portal/overview)** | Publishing and viewing attestations from your browser — no code required |
| 📦 | **[Install the SDK](/sdk/getting-started)** | Integrating OMATrust into your application programmatically |
| ⚡ | **[Quickstart: Publish](/start-here/quickstart-publish)** | Writing your first attestation with the SDK |
| 🔍 | **[Quickstart: Verify](/start-here/quickstart-verify)** | Querying reputation data with the SDK |

## What You Can Do Today

- **Claim responsibility for a file** — Publish a Responsibility Claim for any content-addressed artifact using `did:artifact`. Prove that your organization created, maintains, or distributes a specific binary, package, or document. See [Attestation Types](/reputation/attestation-types#responsibility-claim) for schema details.
- **Publicly authorize x402 signing keys** — Use x402 signed offers and receipts as user review proof of interaction. Learn more in the [x402 Integration Guide](/integrations/x402/overview).
- **Publish attestations** — Issue security audits, compliance certifications, endorsements, user reviews, or user review responses as cryptographically signed on-chain records. See the [Reputation section](/reputation/reputation-model) for details on attestation types and workflows.
- **Verify a service's reputation** — Query on-chain attestations for any internet service using the [SDK](/sdk/getting-started).
- **Integrate trust checks** — Add reputation verification to your app, API, or AI agent in a few lines of code. See the [SDK API Reference](/sdk/api-reference/reputation-sdk) for function signatures.

## Who This Is For

**Service operators and reviewers** — Use the [OMATrust Portal](/portal/overview) to publish attestations, submit reviews, and manage your service's reputation directly from the browser. No SDK integration required.

**Auditors and issuers** — Publish verifiable security audits, compliance certifications, and endorsements that live on-chain and can't be faked. See the [Issuer Workflow](/reputation/issuer-workflow).

**Developers** — Query attestations programmatically to make trust decisions in your applications. Build reputation-aware services with the [SDK](/sdk/getting-started).

**AI agents** — Access machine-readable trust data to verify services before interacting with them. Operate safely at scale. Start with the [Consumer Workflow](/reputation/consumer-workflow).

## Learn More

- 📄 [OMATrust Whitepaper](https://github.com/oma3dao/omatrust-docs/blob/main/whitepaper/omatrust-whitepaper.md) — Vision, economics, and the future of internet trust
- ⭐ [OMATrust Reputation Specification](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-reputation.md) — Attestation schemas and reputation system
- 🔐 [OMATrust Proof Specification](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-proofs.md) — Cryptographic proofs for attestations
- 📋 [OMATrust Identity Specification](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-identity.md) — Application registry, DID ownership, and metadata formats

---
title: x402 Overview
---

# x402 Overview

x402 is an open protocol for HTTP-native payments. It uses the HTTP `402 Payment Required` status code to enable machine-readable payment negotiation directly in the request/response cycle — no API keys, no subscriptions, no out-of-band billing.

OMATrust integrates with x402 in two ways: as a reputation layer for x402-enabled services, and through the Offer and Receipt extension which produces cryptographic proof-of-interaction for attestations.

## x402 resourceUrl as Service Identity

Every x402 payment flow is anchored to a `resourceUrl` — the URL of the paid endpoint. This URL maps directly to a `did:web` identifier:

```
resourceUrl: https://api.example.com/premium-data
         →  did:web:api.example.com
```

This means any x402-enabled service automatically has an identity that can serve as the subject of OMATrust attestations — the same way an app store listing identifies a service for reviews and ratings. No additional registration step is needed to start building reputation for a paid endpoint.

## Why x402 Matters for OMATrust

The internet has no standard way for a service to say "pay me" and for a client to respond with payment — all in a single HTTP exchange. x402 solves this at the protocol level: a server returns `402` with machine-readable payment terms, the client pays, and the server delivers the resource.

This creates a natural integration point for OMATrust:

- **Signed offers** prove that a server committed to specific payment terms. These can be used as evidence in attestations even if no payment occurs.
- **Signed receipts** prove that a client paid and received service. These serve as cryptographic proof-of-interaction for User Review attestations — the equivalent of a "Verified Purchase" badge.
- **Both artifacts are portable** — they can be lifted out of the x402 flow and submitted to OMATrust's EAS-based reputation layer as proof objects attached to attestations.

## How It Works

```
┌─────────┐                      ┌─────────────────┐
│  Client  │                      │ Resource Server  │
└────┬─────┘                      └────────┬─────────┘
     │                                     │
     │  GET /resource                      │
     │ ───────────────────────────────────►│
     │                                     │
     │  402 + Payment Terms                │
     │     + Signed Offer(s)               │
     │ ◄───────────────────────────────────│
     │                                     │
     │  GET /resource + Payment Header     │
     │ ───────────────────────────────────►│
     │                                     │
     │  200 + Resource                     │
     │     + Signed Receipt                │
     │ ◄───────────────────────────────────│
     │                                     │
     │  ┌──────────────────────┐           │
     │  │ Submit receipt as    │           │
     │  │ proof in OMATrust    │           │
     │  │ User Review          │           │
     │  └──────────────────────┘           │
```

1. Client requests a paid resource
2. Server responds with `402` including payment requirements and signed offers
3. Client signs a payment authorization and re-requests with the signed authorization in the header
4. Server verifies payment, delivers the resource, and returns a signed receipt
5. Client can later attach the receipt to an OMATrust User Review attestation as proof of interaction

## Integration Guides

- **[Resource Server Integration](./resource-server)** — For service operators: add offer-receipt signing to your x402 server
- **[Client Integration](./client-attestation)** — For clients: capture receipts and submit attestations to OMATrust

## Further Reading

- [Attestation Types](/reputation/attestation-types) — User Review schema and proof types
- [Verification Flow](/reputation/verification-flow) — How proofs are verified
- [x402 Protocol Specification](https://github.com/coinbase/x402/blob/main/specs/x402-specification-v2.md) — The full x402 protocol spec
- [x402 Repository](https://github.com/coinbase/x402) — SDK, examples, and extension specs

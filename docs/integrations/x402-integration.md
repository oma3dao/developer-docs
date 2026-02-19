---
title: X402 Integration
---

# X402 Integration

x402 is an open protocol for HTTP-native payments. It uses the HTTP `402 Payment Required` status code to enable machine-readable payment negotiation directly in the request/response cycle — no API keys, no subscriptions, no out-of-band billing.

OMATrust integrates with x402 in two ways: as a reputation layer for x402-enabled services, and through the Offer and Receipt extension which produces cryptographic proof-of-interaction for attestations.

## x402 resourceUrl as Service Identity

Every x402 payment flow is anchored to a `resourceUrl` — the URL of the paid endpoint. This URL maps directly to a `did:web` identifier:

```
resourceUrl: https://api.example.com/premium-data
         →  did:web:api.example.com
```

This means any x402-enabled service automatically has an identity that can serve as the subject of OMATrust attestations — the same way an app store listing identifies a service for reviews and ratings. No additional registration step is needed to start building reputation for a paid endpoint.

This makes OMATrust a natural reputation layer for the x402 ecosystem. Clients can look up a service's DID before paying, check its attestations (security audits, user reviews, endorsements), and make an informed trust decision — all before the first HTTP request.

## Why x402 Matters for OMATrust

The internet has no standard way for a service to say "pay me" and for a client to respond with payment — all in a single HTTP exchange. x402 solves this at the protocol level: a server returns `402` with machine-readable payment terms, the client pays, and the server delivers the resource.

This creates a natural integration point for OMATrust:

- **Signed offers** prove that a server committed to specific payment terms. These can be used as evidence in attestations even if no payment occurs.
- **Signed receipts** prove that a client paid and received service. These serve as cryptographic proof-of-interaction for User Review attestations — the equivalent of a "Verified Purchase" badge.
- **Both artifacts are portable** — they can be lifted out of the x402 flow and submitted to OMATrust's EAS-based reputation layer as proof objects attached to attestations.

Other mechanisms for proving service usage exist, but they typically require a centralized intermediary (like a platform marketplace) to vouch for the interaction. x402 embeds cryptographic proof of usage directly into the payment protocol — no intermediary needed. The service signs a receipt, the client holds it, and anyone can verify it independently.

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

## Connection to the Reputation Layer

x402 receipts integrate with OMATrust attestations through the proof system:

- A **User Review** attestation can include an `x402-receipt` proof type, carrying the signed receipt from the server
- Consumers verifying the review can check the receipt signature to confirm the reviewer actually paid for and received the service
- This creates a trust gradient: reviews with valid receipts carry stronger trust signals than reviews without proof of interaction

The receipt proves three things:
1. The reviewer interacted with the specific service (identified by `resourceUrl`)
2. The interaction involved real payment (identified by `network` and optionally `transaction`)
3. The server confirmed service delivery (the receipt is signed by the server)

## Offer and Receipt Extension

The Offer and Receipt extension is the technical mechanism that produces signed offers and receipts. It is specified as an optional, composable addition to x402 that works with both x402 v1 and v2.

The extension supports two signature formats:

- **JWS** — Best for server-side signing with managed keys (HSM, KMS). Uses `did:web` for key resolution.
- **EIP-712** — Best for wallet-based signing. The signer address is recovered directly from the signature.

The extension specification, TypeScript SDK, and working examples are maintained in the x402 repository:

- [Offer and Receipt Extension Specification](https://github.com/coinbase/x402/blob/main/specs/extensions/extension-offer-and-receipt.md) — Full protocol spec with payload schemas, EIP-712 types, verification rules, and wire format examples
- [TypeScript SDK — @x402/extensions](https://github.com/coinbase/x402/tree/main/typescript/packages/extensions/src/offer-receipt) — Server extension, client utilities, signing/verification functions
- [Server Example](https://github.com/coinbase/x402/tree/main/examples/typescript/servers/offer-receipt) — Express.js server with offer-receipt enabled (JWS and EIP-712)
- [Client Example](https://github.com/coinbase/x402/tree/main/examples/typescript/clients/offer-receipt) — Complete client flow showing offer extraction, payment, and receipt capture

## Supported Payment Networks

x402 supports multiple EVM and non-EVM blockchain networks for payment settlement. The protocol uses CAIP-2 network identifiers (e.g., `eip155:8453` for Base) for cross-chain compatibility.

## Getting Started

If you're a service operator wanting to add x402 payments with offer/receipt signing:

1. Install the x402 SDK: `npm install @x402/express @x402/extensions`
2. Configure payment middleware with the offer-receipt extension
3. Signed offers and receipts are automatically added to your payment flows

If you're a client wanting to capture receipts for OMATrust attestations:

1. Use the `@x402/extensions/offer-receipt` client utilities
2. Extract offers from `402` responses and receipts from success responses
3. Submit receipts as proof objects when publishing User Review attestations

## Further Reading

- [Attestation Types](/reputation/attestation-types) — User Review schema and proof types
- [Verification Flow](/reputation/verification-flow) — How proofs are verified
- [x402 Protocol Specification](https://github.com/coinbase/x402/blob/main/specs/x402-specification-v2.md) — The full x402 protocol spec
- [x402 Repository](https://github.com/coinbase/x402) — SDK, examples, and extension specs

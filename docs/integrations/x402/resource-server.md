---
title: Resource Server Integration
---

# Resource Server Integration

> New to x402 and OMATrust? Start with the [x402 Overview](./overview) for context on how the protocol and reputation layer fit together. For a complete understanding of how OMATrust reputation works, we recommend reading the [Start Here](/) documentation.

This guide shows how to add the x402 Offer and Receipt extension to your resource server. Once configured, your server automatically signs offers on `402` responses and receipts on `200` responses- no changes to your business logic.

## Why Integrate Offer & Receipt Signing?

When your server signs offers and receipts, clients can attach those receipts to OMATrust [User Review](/reputation/attestation-types#user-review) attestations as cryptographic proof-of-interaction. Reviews backed by valid receipts carry stronger trust signals — they're the "Verified Purchase" equivalent for the open web.

This benefits your service directly:

- **Better discoverability** — Services with verified reviews rank higher in trust scoring, making them more visible to potential clients.
- **Client confidence** — New clients are more likely to use your service when existing reviews are backed by cryptographic proof that reviewers actually paid for and received the service.
- **No extra work** — The extension is composable middleware. You configure it once and it handles signing automatically.

## Prerequisites

- An existing x402 resource server (or a new Express.js project). 
- Node.js 18+
- A facilitator URL (see [x402 docs](https://docs.x402.org/))

If you're starting from scratch, follow the [x402 Quickstart for Sellers](https://docs.x402.org/getting-started/quickstart-for-sellers) first to get a basic payment server running, then come back here to add offer-receipt signing.

## Installation

```bash
npm install @x402/express @x402/extensions @x402/evm @x402/core viem
```

## Signing Formats

The extension supports two signature formats. Choose based on your key management setup:

| Format | Key Type | Identity | Best For |
|--------|----------|----------|----------|
| **EIP-712** | secp256k1 (Ethereum) | `did:pkh` (address recovered from signature) | Wallet-based signing. Simpler setup, especially with managed wallet providers. |
| **JWS** | Any asymmetric key (EC P-256, Ed25519, secp256k1, etc.) | `did:web` (resolved via `/.well-known/did.json`) | Server-side signing with managed keys (HSM, KMS). Also supports Solana keys, so if your infrastructure is Solana-native, JWS may be the more natural fit. |

Both formats produce equivalent proof artifacts. Clients and verifiers handle both transparently.

## Quick Start: EIP-712 with Environment Variables

This example uses EIP-712 signing with a raw private key from an environment variable. This is the simplest way to get started.

:::warning Not for Production
Storing private keys in environment variables is acceptable for local development and testing. For production deployments, use a key management service (KMS), hardware security module (HSM), or a managed wallet provider. See [Production Key Management](#production-key-management) below.
:::

:::caution Signing Key ≠ Payment Address
The signing key used for offers and receipts should be a **dedicated signing key**, not the wallet that receives payments (`payTo`). Separating signing from payment receipt limits exposure if the signing key is compromised.
:::

### Environment Variables

Create a `.env` file:

```bash
# Wallet address that receives payments
EVM_ADDRESS=0xYourPaymentWalletAddress

# Private key for signing offers and receipts (EIP-712)
# This should be a DEDICATED SIGNING KEY, not the payment wallet's key
# For production deployments, do not store private keys in an environment variable
SIGNING_PRIVATE_KEY=0xYourDedicatedSigningPrivateKey

# x402 facilitator URL
FACILITATOR_URL=https://facilitator.x402.org

# Signing format
SIGNING_FORMAT=eip712
```

### Server Setup (EIP-712)

```typescript
import { config } from "dotenv";
import express from "express";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";
import {
  createOfferReceiptExtension,
  createEIP712OfferReceiptIssuer,
  declareOfferReceiptExtension,
} from "@x402/extensions/offer-receipt";
import { privateKeyToAccount } from "viem/accounts";

config();

const evmAddress = process.env.EVM_ADDRESS as `0x${string}`;
const signingPrivateKey = process.env.SIGNING_PRIVATE_KEY as `0x${string}`; // not for production
const facilitatorUrl = process.env.FACILITATOR_URL!;

// Create EIP-712 signer from the dedicated signing key
const signingAccount = privateKeyToAccount(signingPrivateKey);
const kid = `did:pkh:eip155:1:${signingAccount.address}#key-1`;

const offerReceiptIssuer = createEIP712OfferReceiptIssuer(
  kid,
  signingAccount.signTypedData.bind(signingAccount),
);

// Set up the resource server with the extension
const facilitatorClient = new HTTPFacilitatorClient({ url: facilitatorUrl });
const resourceServer = new x402ResourceServer(facilitatorClient)
  .register("eip155:84532", new ExactEvmScheme())
  .registerExtension(createOfferReceiptExtension(offerReceiptIssuer));

const app = express();

// Configure payment routes with offer-receipt enabled
app.use(
  paymentMiddleware(
    {
      "GET /api/data": {
        accepts: [
          {
            scheme: "exact",
            price: "$0.001",
            network: "eip155:84532",
            payTo: evmAddress, // Payment goes here (different from signing key)
          },
        ],
        description: "Premium data endpoint",
        mimeType: "application/json",
        extensions: {
          ...declareOfferReceiptExtension({ includeTxHash: false }),
        },
      },
    },
    resourceServer,
  ),
);

// Your business logic — unchanged
app.get("/api/data", (req, res) => {
  res.json({ data: "your premium content" });
});

app.listen(4021, () => {
  console.log("Server listening on http://localhost:4021");
  console.log("Offer-receipt extension enabled (EIP-712)");
});
```

### What Happens Automatically

Once configured the extension hooks into the x402 payment flow:

1. **On `402` responses**: The extension signs an offer for each entry in `accepts[]` and includes them in the response's `extensions` field. Each offer contains the payment terms (`scheme`, `network`, `amount`, `payTo`) and a `validUntil` timestamp.

2. **On `200` responses** (after successful payment): The extension signs a receipt containing the `resourceUrl`, `payer` address, `network`, and `issuedAt` timestamp. The receipt is included in the `PAYMENT-RESPONSE` header's `extensions` field.

No changes to your route handlers are needed. The extension is composable middleware.

## Alternative Start: JWS Signing with `did:web`

JWS signing uses a `did:web` identifier, which means your server must host a DID document at `/.well-known/did.json`. Clients and verifiers resolve this document to find your public key so they can verify the signature.

JWS supports a wider range of key types than EIP-712 (secp256k1 only), including secp256r1 (EC P-256), Ed25519, and secp256k1 (ES256K). If your infrastructure is enterprise-oriented or Solana-native (Ed25519), JWS lets you use your existing setup.

### Environment Variables

```bash
EVM_ADDRESS=0xYourPaymentWalletAddress
FACILITATOR_URL=https://facilitator.x402.org
SIGNING_FORMAT=jws

# Base64-encoded PKCS#8 private key (EC P-256)
# For production deployments, do not store private keys in an environment variable
SIGNING_PRIVATE_KEY=base64EncodedPrivateKey

# Your server's domain (URL-encoded for did:web)
# e.g., "api.example.com" or "localhost%3A4021" for local dev
SERVER_DOMAIN=api.example.com
```

### Server Setup (JWS)

```typescript
import * as crypto from "crypto";
import {
  createOfferReceiptExtension,
  createJWSOfferReceiptIssuer,
  declareOfferReceiptExtension,
  type JWSSigner,
} from "@x402/extensions/offer-receipt";

const serverDomain = process.env.SERVER_DOMAIN!;
const signingPrivateKey = process.env.SIGNING_PRIVATE_KEY!; // not for production

const did = `did:web:${serverDomain}`;
const kid = `${did}#key-1`;

// Create JWS signer from PKCS#8 private key
const privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${signingPrivateKey}\n-----END PRIVATE KEY-----`;
const keyObject = crypto.createPrivateKey(privateKeyPem);
const publicKeyJwk = keyObject.export({ format: "jwk" });
delete (publicKeyJwk as Record<string, unknown>).d; // Remove private component

const jwsSigner: JWSSigner = {
  kid,
  format: "jws",
  algorithm: "ES256",
  async sign(payload: Uint8Array): Promise<string> {
    const sign = crypto.createSign("SHA256");
    sign.update(payload);
    const signature = sign.sign(privateKeyPem);
    return Buffer.from(derToRaw(signature)).toString("base64url");
  },
};

const offerReceiptIssuer = createJWSOfferReceiptIssuer(kid, jwsSigner);

// ... register with x402ResourceServer the same way as the EIP-712 example:
// resourceServer.registerExtension(createOfferReceiptExtension(offerReceiptIssuer));
```

### Hosting the DID Document

For JWS verification, clients resolve your `did:web` to find the public key. Serve the DID document at `/.well-known/did.json`:

```typescript
app.get("/.well-known/did.json", (req, res) => {
  res.setHeader("Content-Type", "application/did+json");
  res.json({
    "@context": [
      "https://www.w3.org/ns/did/v1",
      "https://w3id.org/security/suites/jws-2020/v1",
    ],
    id: did,
    verificationMethod: [
      {
        id: kid,
        type: "JsonWebKey2020",
        controller: did,
        publicKeyJwk,
      },
    ],
    assertionMethod: [kid],
  });
});
```

## Production Key Management

:::warning
The examples above use environment variables for signing keys. This is fine for development but not recommended for production. Private keys in environment variables can leak through process inspection, logging, crash dumps, and container metadata endpoints.
:::

For production, use a signing backend that keeps keys in secure hardware or managed infrastructure. The extension's signer interface is pluggable — you only need to implement the `sign()` function (for JWS) or `signTypedData()` function (for EIP-712) using your provider's SDK. The `OfferReceiptIssuer` interface handles the rest.

When using a managed wallet provider, you won't have access to the raw private key. Instead, you call the provider's signing API. Here's what the EIP-712 setup looks like with a server wallet (conceptual example):

```typescript
import {
  createOfferReceiptExtension,
  createEIP712OfferReceiptIssuer,
} from "@x402/extensions/offer-receipt";

// The provider's SDK gives you a signTypedData function
// that calls their API — the private key never leaves their infrastructure
const signerAddress = "0xYourServerWalletAddress";
const kid = `did:pkh:eip155:1:${signerAddress}#key-1`;

const offerReceiptIssuer = createEIP712OfferReceiptIssuer(kid, async (params) => {
  // Call your wallet provider's signing API
  return await yourWalletProvider.signTypedData({
    domain: params.domain,
    types: params.types,
    primaryType: params.primaryType,
    message: params.message,
  });
});

// Register as usual
resourceServer.registerExtension(createOfferReceiptExtension(offerReceiptIssuer));
```

The key difference from the environment variable example: you never construct a `privateKeyToAccount` — instead, you pass a function that delegates signing to the provider's API.

## Binding Your Signing Key to Your Service Identity

Signing offers and receipts is only half the story. For verifiers to trust that your signatures are legitimate, they need to confirm that your signing key is authorized to act on behalf of your service's identity (`did:web:yourdomain.com`).

There are several ways to establish this binding, from lightweight DNS records to formal on-chain attestations. Choose based on your assurance requirements.

### Option 1: DID Document (`did.json`)

If you're using JWS signing, you're already hosting a DID document at `/.well-known/did.json` (see [JWS setup above](#hosting-the-did-document)). This document declares which keys are authorized for your `did:web` identity. Verifiers resolve your DID and check that the signing key is listed in `verificationMethod`.  

If you're using EIP-712 for signing you can use this option as well.

This is the simplest option and is sufficient for many use cases. It is a well-known mechanism (pun intended).  However, the DID document is mutable.  If you remove the key later, verifiers checking at that point won't find it.  See Recommendation 1 below on how to make this mechanism immutable and give your signatures more durability.

### Option 2: DNS TXT Record

Publish a TXT record at `_omatrust.yourdomain.com` asserting your signing key as a controller:

```
_omatrust.yourdomain.com  TXT  "v=1;controller=did:pkh:eip155:1:0xYourSigningAddress"
```

Verifiers can look up the DNS record to confirm the binding. However, like `did.json`, DNS records are mutable. Consider pairing with a Controller Witness attestation for temporal anchoring (Recommendation 1 below).

## Recommended Key Binding Practices

For the strongest assurance for verifiers and the most control for you, we recommend two more key binding practices once you choose one of the above two options.

### Recommendation 1: Controller Witness (Temporal Anchoring)

A [Controller Witness](/reputation/attestation-types#controller-witness) attestation is issued by a third-party witness that observes your DNS TXT record or `did.json` at a specific time and anchors that observation on-chain. This solves the mutability problem: even if you later remove the DNS record, the on-chain witness attestation proves the binding existed at the observed time.

Controller Witness attestations support multiple observation methods: `dns-txt`, `did-json`, `social-profile`, and `manual`. They're designed to complement Linked Identifier and Key Binding attestations.

### Recommendation 2: Key Binding Attestation (On-Chain)

Publish a [Key Binding](/reputation/attestation-types#key-binding) attestation on-chain. You still need to choose one of the above key binding options but the attestation declares that your signing key (`keyId`) is authorized to act on behalf of your service's DID (`subject`), with a specific `keyPurpose` (e.g., `assertionMethod` for signing offers and receipts, which is defined by the W3C). 

In addition, the attestation allows you to explicitly revoke authorization if your signing key is rotated (good security practice) or compromised (good contingency planning).  It also allows you to specifiy an expiration date, after which the key is no longer authorized.

Once you have set up `did.json` or DNS TXT you can submit a Key Binding attestation on the [OMATrust Reputation Portal](https://reputation.omatrust.org/attest/key-binding).  This front end automatically submits a Controller Witness attestation as well.

### Which Should I Use?

| Approach | Assurance Level | Persistence | Best For |
|----------|----------------|-------------|----------|
| `did.json` | Moderate | Mutable (web-hosted) | JWS signers already hosting a DID document |
| DNS TXT | Moderate | Mutable (DNS) | Quick setup, works with both signing formats |
| Key Binding | High | Immutable (on-chain) | Production services wanting maximum verifiability |
| Controller Witness | High | Immutable (on-chain) | Anchoring mutable evidence (DNS, did.json) with a timestamp |

## Offer and Receipt Extension

The Offer and Receipt extension is the technical mechanism that produces signed offers and receipts. It is specified as an optional, composable addition to x402 that works with both x402 v1 and v2.

The extension specification, TypeScript SDK, and working examples are maintained in the x402 repository:

- [Offer and Receipt Extension Specification](https://github.com/coinbase/x402/blob/main/specs/extensions/extension-offer-and-receipt.md) — Full protocol spec with payload schemas, EIP-712 types, verification rules, and wire format examples
- [TypeScript SDK — @x402/extensions](https://github.com/coinbase/x402/tree/main/typescript/packages/extensions/src/offer-receipt) — Server extension, client utilities, signing/verification functions
- [Server Example](https://github.com/coinbase/x402/tree/main/examples/typescript/servers/offer-receipt) — Express.js server with offer-receipt enabled (JWS and EIP-712)
- [Client Example](https://github.com/coinbase/x402/tree/main/examples/typescript/clients/offer-receipt) — Complete client flow showing offer extraction, payment, and receipt capture

## Extension Configuration

The `declareOfferReceiptExtension` function accepts an optional configuration object:

```typescript
declareOfferReceiptExtension({
  // Include the blockchain transaction hash in receipts.
  // Default: false (for privacy — the payer address is still included).
  // Set to true if verifiability is more important than privacy.
  includeTxHash: false,

  // How long offers remain valid, in seconds.
  // Default: 300 (5 minutes). Falls back to the route's maxTimeoutSeconds.
  offerValiditySeconds: 300,
});
```

You can configure this per-route — different endpoints can have different settings.

## How Receipts Become Attestation Proofs

The receipts your server signs are designed to be portable. A client who receives a receipt can later submit it as a `proof` object in an OMATrust [User Review](/reputation/attestation-types#user-review) attestation:

- Proof type: `x402-receipt`
- Proof purpose: `commercial-tx`
- The receipt's `resourceUrl` maps to the reviewed service's DID (`did:web:...`)
- Verifiers check the receipt signature to confirm the reviewer actually paid for and received the service

Your server doesn't need to do anything extra — the extension produces the receipts, and clients handle the attestation submission.

See the [Client Integration Guide](./client-attestation) for the client-side flow.

## Responding to User Reviews

Clients who use your service can submit [User Review](/reputation/attestation-types#user-review) attestations — including reviews backed by the receipts your server signs. If a review is inaccurate or unfair, you can respond with a [User Review Response](/reputation/attestation-types#user-review-response) attestation. This is an on-chain response linked to the original review via `refUID`, allowing you to acknowledge, clarify, or dispute the feedback.

User Review Responses don't carry proofs — verification is based on confirming that the responder is the reviewed service (or a verifiable delegate established via [Support Attestations](/reputation/attestation-types#support-attestations)). You can submit a response through the [OMATrust Reputation Portal](https://reputation.omatrust.org) or via the [Delegated Attestation API](/api/delegated-attestation).

## Further Reading

- [x402 Overview](./overview) — How x402 and OMATrust fit together
- [Client Integration](./client-attestation) — Client-side receipt capture and attestation submission
- [Offer and Receipt Extension Specification](https://github.com/coinbase/x402/blob/main/specs/extensions/extension-offer-and-receipt.md) — Full protocol spec
- [Attestation Types](/reputation/attestation-types) — User Review schema and proof types
- [Verification Flow](/reputation/verification-flow) — How proofs are verified

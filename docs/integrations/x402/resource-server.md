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

## Trust Tiers: Binding Your Signing Key to Your Service Identity

Signing offers and receipts is only half the story. For verifiers to trust that your signatures are legitimate, they need to confirm that your signing key is authorized to act on behalf of your service's identity (`did:web:yourdomain.com`).

OMATrust uses a tiered trust model. Each tier builds on the previous one, adding durability and security guarantees. You can start at Tier 1 and add higher tiers as your service matures.

### Tier 1: Ephemeral Evidence (DNS TXT / did.json)

The baseline. Publish your controller key(s) so verifiers can look them up in real time.

**DNS TXT record** at `_controllers.yourdomain.com`:

```
_controllers.yourdomain.com  TXT  "v=1;controller=did:pkh:eip155:1:0xYourEIP712SigningAddress;controller=did:jwk:eyJrdHkiOiJFQyIsImNydiI6IlAtMjU2IiwieCI6Ii4uLiIsInkiOiIuLi4ifQ"
```

A single TXT record can declare multiple controllers — one per signing key. Use `did:pkh:eip155:<chainId>:<address>` for EVM keys and `did:jwk:<base64url-encoded-public-key>` for JWS keys.  However, note that TXT records have a 255 character limit so can only safely store 1 `did:jwk` controller.

**DID document** at `https://yourdomain.com/.well-known/did.json`:

```json
{
  "@context": ["https://www.w3.org/ns/did/v1", "https://w3id.org/security/suites/jws-2020/v1"],
  "id": "did:web:yourdomain.com",
  "verificationMethod": [
    {
      "id": "did:web:yourdomain.com#eip712-key",
      "type": "EcdsaSecp256k1RecoveryMethod2020",
      "controller": "did:web:yourdomain.com",
      "blockchainAccountId": "eip155:1:0xYourEIP712SigningAddress"
    },
    {
      "id": "did:web:yourdomain.com#jws-key",
      "type": "JsonWebKey2020",
      "controller": "did:web:yourdomain.com",
      "publicKeyJwk": {
        "kty": "EC",
        "crv": "P-256",
        "x": "...",
        "y": "..."
      }
    }
  ],
  "assertionMethod": ["did:web:yourdomain.com#eip712-key", "did:web:yourdomain.com#jws-key"]
}
```

:::tip Enable DNSSEC
If you use DNS TXT records, enable DNSSEC on your domain. Without DNSSEC, DNS responses can be spoofed — an attacker could inject a false controller record. DNSSEC cryptographically signs DNS responses, giving verifiers confidence that the record is authentic. Most registrars support DNSSEC with a one-click enable.

Without DNSSEC, verifiers may reduce the trust level of DNS-based evidence.
:::

**Limitations of Tier 1:** This evidence is mutable. If you remove or change the DNS record or DID document, verifiers checking *after* the change won't find the key. This means:

- Old receipts signed by a rotated key become unverifiable
- If your DNS or web server is temporarily down, all verification fails
- There's no historical proof that the key was ever authorized

Tier 1 is sufficient for real-time verification of recent receipts. For durable trust, add Tier 2.

### Tier 2: Controller Witness (Temporal Anchoring)

A [Controller Witness](/api/controller-witness) attestation is an immutable on-chain record that a trusted third party observed your controller evidence at a specific point in time. This solves the fundamental problem with mutable evidence: **keys change, but the past doesn't.**

**Why this matters:**

- **Key rotation.** Good security practice means rotating signing keys periodically. When you rotate, you remove the old key from DNS/did.json. Without a witness, all receipts signed by the old key become unverifiable — even though they were legitimate when signed.

- **Key compromise.** If a key is stolen, you revoke it immediately. But receipts signed *before* the compromise are still valid. A controller witness proves the key was authorized during the period before compromise, preserving the validity of those earlier receipts.

- **Algorithm migration.** Moving from RSA to elliptic curve to quantum-resistant keys means old keys disappear from your current evidence. Witnesses preserve the historical record of each key's authorization period.

- **Infrastructure disruptions.** DNS outages, registrar migrations, server downtime, CDN misconfigurations — any of these can make your live evidence temporarily unreachable. A controller witness means verification doesn't depend on a single live endpoint being available at the moment someone checks.

**How to get a Controller Witness:**

Option A — Call the [Controller Witness API](/api/controller-witness):

```ts
import { requestControllerWitness } from "@oma3/omatrust/reputation";

await requestControllerWitness({
  subjectDid: "did:web:yourdomain.com",
  controllerDid: "did:pkh:eip155:1:0xYourSigningAddress",
});
```

Option B — Use the [OMATrust Reputation Portal](https://app.omatrust.org) and follow the Controller Witness flow in the UI.

The witness checks your DNS TXT and/or did.json, confirms the controller key is published, and anchors that observation on-chain with a timestamp. From that point forward, verifiers can confirm the key was authorized at `observedAt` regardless of what your live evidence says today.

**When to file a Controller Witness:**

- As soon as possible, preferably before using the key for signing
- Absolutely before the key is taken out of service
- Optional- file additional Controller Witness attestations periodically (verifiers may discount keys used for too long without another Controller Witness) 

### Tier 3: Key Binding (Full Lifecycle Control)

A [Key Binding](/reputation/attestation-types#key-binding) attestation gives you enterprise-grade control over your signing key's lifecycle:

- **Purpose declaration** — declare what the key is authorized to do (e.g., `assertionMethod` for signing offers and receipts). A key authorized only for `authentication` cannot legitimately sign commercial artifacts.
- **Expiration** — set a time limit on the key's authorization. After expiration, verifiers reject signatures from that key for any timestamp after the expiry.
- **Revocation** — explicitly revoke a key if it's compromised or retired. Revocation closes the authorization window at a specific point in time.

**Key Bindings require a Controller Witness.** The Controller Witness proves that the Key Binding was submitted by a party legitimately authorized by the subject. Without it, anyone could publish a Key Binding claiming to control your service. The witness anchors the authorization chain: your DNS/did.json declares the controller → the witness observes and anchors that declaration → the Key Binding declares the key's purpose and lifecycle.

**How to submit a Key Binding:**

Use the [OMATrust Reputation Portal](https://app.omatrust.org/attest/key-binding). The portal automatically submits a Controller Witness alongside the Key Binding.

Or use the SDK to submit both programmatically:

```ts
import { requestControllerWitness, submitAttestation } from "@oma3/omatrust/reputation";

// 1. Anchor the controller evidence
await requestControllerWitness({
  subjectDid: "did:web:yourdomain.com",
  controllerDid: "did:pkh:eip155:1:0xYourSigningAddress",
});

// 2. Submit the Key Binding attestation
await submitAttestation({
  signer,
  chainId: 66238,
  easContractAddress: "0x...",
  schemaUid: "0x807b...",
  schema: "string subject, string keyId, string keyPurpose, ...",
  data: {
    subject: "did:web:yourdomain.com",
    keyId: "did:pkh:eip155:1:0xYourSigningAddress",
    keyPurpose: "assertionMethod",
    // ...
  },
});
```

### Trust Tier Summary

| Tier | Mechanism | Durability | What It Proves |
|------|-----------|------------|----------------|
| 1 | DNS TXT / did.json | Mutable (live lookup) | Key is authorized *right now* |
| 2 | Controller Witness | Immutable (on-chain) | Key was authorized at a specific point in time |
| 3 | Key Binding | Immutable (on-chain) | Key's purpose, expiration, and revocation status |

Start with Tier 1 to get up and running. Add Tier 2 if you want additional trust. Add Tier 3 when you need explicit lifecycle control or purpose-scoped authorization.

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
- [Client Verification](./client-verification) — How verifiers check x402 proofs and authorization
- [Offer and Receipt Extension Specification](https://github.com/coinbase/x402/blob/main/specs/extensions/extension-offer-and-receipt.md) — Full protocol spec
- [Attestation Types](/reputation/attestation-types) — User Review schema and proof types
- [Verification Flow](/reputation/verification-flow) — How proofs are verified
- [Controller Witness API](/api/controller-witness) — The witness attestation endpoint

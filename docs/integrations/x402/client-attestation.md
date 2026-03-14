---
title: Client Integration
---

# Client Integration

> New to x402 and OMATrust? Start with the [x402 Overview](./overview) for context on how the protocol and reputation layer fit together. For a complete understanding of how OMATrust reputation works, we recommend reading the [Start Here](/) documentation.

This guide shows how to extract signed offers and receipts from x402 payment flows and submit them as proof-of-interaction in OMATrust User Review attestations.

A signed receipt from an x402 resource server proves you paid for and received a service. Attaching it to a User Review creates a "Verified Purchase" equivalent — verifiers can check the receipt signature to confirm you actually used the service.

## Prerequisites

- An x402 resource server with the offer-receipt extension enabled (see [Resource Server Integration](./resource-server))
- Node.js 18+
- A funded wallet for x402 payments. 

If you're new to x402 client setup, the [x402 Quickstart for Buyers](https://docs.x402.org/getting-started/quickstart-for-buyers) covers the basics of making payments — this guide builds on that by adding receipt extraction and attestation submission.

## Installation

```bash
npm install @x402/fetch @x402/extensions @x402/evm
```

## Overview

The client flow has three phases:

1. **Extract offers** from `402` responses (proves the server committed to payment terms)
2. **Extract receipt** from `200` responses (proves payment was received and service delivered)
3. **Submit attestation** to OMATrust with the receipt as proof

## Connection to the Reputation Layer

x402 receipts integrate with OMATrust attestations through the proof system:

- A **User Review** attestation can include an `x402-receipt` proof type, carrying the signed receipt from the server
- Consumers verifying the review can check the receipt signature to confirm the reviewer actually paid for and received the service
- This creates a trust gradient: reviews with valid receipts carry stronger trust signals than reviews without proof of interaction

The receipt proves three things:
1. The reviewer interacted with the specific service (identified by `resourceUrl`)
2. The interaction involved real payment (identified by `network` and optionally `transaction`)
3. The server confirmed service delivery (the receipt is signed by the server)

## Step 1: Set Up the x402 Client

The examples in this guide use the same wallet for x402 payments and attestation signing. This is the easiest setup: the receipt's `payer` address matches the attestation's `attester` automatically, so the proof verifies without any extra identity binding. For a more secure, enterprise-oriented setup where payment and signing wallets are kept separate, see [Wallet Identity and Attestation Signing](#wallet-identity-and-attestation-signing).

The code examples below use environment variables for the private key to keep things simple. In practice, your client should be using a managed wallet provider — environment variables are not secure for production use. Any provider that supports `signTypedData` for EIP-712 will work as a drop-in replacement.

```typescript
import { x402Client, x402HTTPClient, type PaymentRequired } from "@x402/fetch";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";
import {
  extractOffersFromPaymentRequired,
  decodeSignedOffers,
  extractReceiptFromResponse,
  extractReceiptPayload,
  verifyReceiptMatchesOffer,
  verifyOfferSignatureJWS,
  verifyOfferSignatureEIP712,
  verifyReceiptSignatureJWS,
  verifyReceiptSignatureEIP712,
  isJWSSignedOffer,
  isJWSSignedReceipt,
} from "@x402/extensions/offer-receipt";

const evmSigner = privateKeyToAccount(process.env.EVM_PRIVATE_KEY as `0x${string}`);  // replace with your current wallet provider
const client = new x402Client();
registerExactEvmScheme(client, { signer: evmSigner });
const httpClient = new x402HTTPClient(client);
```

## Step 2: Make a Payment and Extract Artifacts

```typescript
const url = "https://api.example.com/premium-data";

// Initial request — expect a 402
const initialResponse = await fetch(url);
const paymentRequiredBody = (await initialResponse.json()) as PaymentRequired;
const paymentRequired = httpClient.getPaymentRequiredResponse(
  (name) => initialResponse.headers.get(name),
  paymentRequiredBody,
);

// Extract signed offers from the 402 response
const signedOffers = extractOffersFromPaymentRequired(paymentRequired);
const decodedOffers = decodeSignedOffers(signedOffers);

// Verify offer signatures and select one
let selectedOffer = null;
for (const decoded of decodedOffers) {
  try {
    if (isJWSSignedOffer(decoded.signedOffer)) {
      await verifyOfferSignatureJWS(decoded.signedOffer);
    } else {
      await verifyOfferSignatureEIP712(decoded.signedOffer);
    }
    selectedOffer = decoded;
    break;
  } catch {
    // Offer failed verification, try next
  }
}

// Create payment and retry
const paymentPayload = await client.createPaymentPayload(paymentRequired);
const paymentHeaders = httpClient.encodePaymentSignatureHeader(paymentPayload);

const paidResponse = await fetch(url, {
  method: "GET",
  headers: paymentHeaders,
});

// Extract signed receipt from the 200 response
const signedReceipt = extractReceiptFromResponse(paidResponse);
```

At this point you have two artifacts:
- `selectedOffer` — the server's signed commitment to payment terms (proof type: `x402-offer`)
- `signedReceipt` — the server's signed confirmation of service delivery (proof type: `x402-receipt`)

## Step 3: Verify the Receipt

Before using the receipt as proof, verify it:

```typescript
if (signedReceipt) {
  // 1. Verify the receipt signature
  if (isJWSSignedReceipt(signedReceipt)) {
    await verifyReceiptSignatureJWS(signedReceipt);
  } else {
    await verifyReceiptSignatureEIP712(signedReceipt);
  }

  // 2. Verify the receipt payload matches the offer
  const verified = verifyReceiptMatchesOffer(
    signedReceipt,
    selectedOffer,
    [evmSigner.address],
  );

  if (!verified) {
    throw new Error("Receipt does not match the accepted offer");
  }
}
```

`verifyReceiptMatchesOffer` checks that:
- `resourceUrl` matches the offer
- `network` matches the offer
- `payer` matches one of your wallet addresses
- `issuedAt` is recent (within 1 hour by default)

## Step 4: Submit an OMATrust User Review with Receipt Proof

With a verified receipt, you can submit a User Review attestation that includes the receipt as cryptographic proof of interaction:

```typescript
const userReview = {
  attester: `did:pkh:eip155:1:${evmSigner.address}`,
  subject: "did:web:api.example.com", // Derived from the resourceUrl
  issuedAt: Math.floor(Date.now() / 1000),
  ratingValue: 5,
  reviewBody: "Fast and reliable API with accurate data.",
  proofs: [
    {
      proofType: "x402-receipt",
      proofPurpose: "commercial-tx",
      proofObject: signedReceipt, // The signed receipt from the server
    },
  ],
};
```

The proof wrapper follows the OMATrust [proof specification](/reputation/verification-flow#the-proof-wrapper):
- `proofType`: `x402-receipt` — identifies the verification algorithm
- `proofPurpose`: `commercial-tx` — indicates this proves a commercial transaction
- `proofObject`: the signed receipt artifact (JWS or EIP-712 format, as received from the server)

## Using an **Offer** as Proof

You can also attach a signed **offer** as proof — note this is different from a receipt. An `x402-offer` proof carries a different meaning: it proves the server committed to specific commercial terms, but does **not** prove payment or delivery. This is useful when you interacted with a service but didn't receive a receipt.

```typescript
const reviewWithOfferProof = {
  attester: `did:pkh:eip155:1:${evmSigner.address}`,
  subject: "did:web:api.example.com",
  issuedAt: Math.floor(Date.now() / 1000),
  ratingValue: 3,
  reviewBody: "Received the service but did not get a receipt.",
  proofs: [
    {
      proofType: "x402-offer",
      proofPurpose: "commercial-tx",
      proofObject: selectedOffer.signedOffer, // The signed OFFER, not a receipt
    },
  ],
};
```

Both `x402-receipt` and `x402-offer` are valid proof types for User Reviews. A receipt proves the server confirmed delivery; an offer proves the server committed to payment terms and the client paid, but no delivery confirmation was issued. If your client received a receipt, use the receipt. If the server didn't issue a receipt, the offer is still a strong proof of interaction — the server can dispute it with a [User Review Response](/reputation/attestation-types#user-review-response) attestation. See [Attestation Types — User Review](/reputation/attestation-types#user-review) for the full proof type table.

## Proof Verification by Consumers

When a consumer (another client, an aggregator, a trust scoring engine) encounters your review, they verify the proof by:

1. Extracting the `proofObject` (the signed receipt or offer)
2. Verifying the signature — JWS signatures are verified by resolving the signer's `did:web` to find the public key; EIP-712 signatures are verified by recovering the signer address directly
3. Checking that the receipt's `resourceUrl` maps to the review's `subject` DID
4. Confirming the receipt's `payer` matches the review's `attester`

If all checks pass, the review is classified as "verified" — the reviewer demonstrably used the service. See [Verification Flow](/reputation/verification-flow) for the full verification process.

## Wallet Identity and Attestation Signing

When you submit a User Review with an `x402-receipt` proof, verifiers check that the receipt's `payer` matches the attestation's `attester`. If they don't match directly, the verifier also looks for a [Linked Identifier](/reputation/attestation-types#linked-identifier) or [Key Binding](/reputation/attestation-types#key-binding) attestation that ties the two wallets together. The proof only fails verification if the addresses don't match *and* no such linkage exists. How you manage your wallet identity determines whether this linkage is needed.

There are two approaches:

| Approach | Identity Binding | Complexity |
|----------|-----------------|------------|
| **One wallet** for payments and attestations | Automatic — `payer` = `attester` | Minimal |
| **Separate wallets** for payments and attestations | Requires a Linked Identifier or Key Binding attestation | More involved |

### The Easiest Path: One Wallet

You already have a wallet — it's the one making x402 payments. Use that same wallet to sign attestations and the receipt's `payer` and the attestation's `attester` match automatically. No identity binding, no extra configuration.

When submitting attestations to OMATrust, clients use the [Delegated Attestation API](/api/delegated-attestation) — you sign an EIP-712 typed message off-chain, and the OMATrust reputation server submits the on-chain transaction on your behalf (paying gas). Your wallet only needs to support `signTypedData` for EIP-712. It does not need to hold native tokens on OMAChain or submit any on-chain transactions directly.

Any managed wallet provider that supports both x402 payments and `signTypedData` works here — one wallet handles both flows. [Coinbase AgentKit](https://docs.cdp.coinbase.com/) is a natural fit, since it handles x402 payments and EIP-712 signing in a single managed wallet.

:::note Non-EVM Chains
This path assumes your x402 payments are on an EVM chain. If you're paying on a non-EVM chain (e.g., Solana), you cannot use the same wallet for OMATrust attestations — OMATrust currently requires EIP-712 signing, which non-EVM wallets don't support. OMA3 is in the process of extending OMATrust to non-EVM chains to enable verifiable user reviews for x402 transactions settled outside the EVM ecosystem. If you would like to help with this effort, please join OMA3 at [oma3.org/join](https://oma3.org/join).
:::

### The Advanced Path: Separate Wallets

For enterprise or high-security deployments, you may want to keep your payment wallet separate from your attestation signing wallet. This limits exposure — if the attestation key is compromised, your payment wallet is unaffected, and vice versa.

The tradeoff: since the receipt's `payer` (your payment wallet) won't match the attestation's `attester` (your signing wallet), verifiers can't automatically confirm they belong to the same entity. You need to explicitly bind the two wallets together using one of these OMATrust Support Attestations:

- **[Linked Identifier](/reputation/attestation-types#linked-identifier)** — Asserts that two DIDs are controlled by the same entity. Set your primary identity as the `subject` and the other wallet as the `linkedId`. Requires a proof of shared control (`pop-eip712` or `pop-jws`).
- **[Key Binding](/reputation/attestation-types#key-binding)** — Declares that a specific key is authorized to act on behalf of a subject DID, with a defined `keyPurpose` (e.g., `assertionMethod`). Provides lifecycle management: expiration, rotation, and revocation.

Both attestation types must be revocable and require a `shared-control` proof. Once published, verifiers can trace the chain from the receipt's `payer` to the attestation's `attester` and confirm they're the same entity.

:::warning Storing Keys in Environment Variables
Avoid storing private keys in environment variables. Private keys in environment variables can leak through process inspection, logging, crash dumps, and container metadata endpoints. Use a managed wallet provider that keeps keys in secure hardware or managed infrastructure.
:::

## End-to-End Example

Here's the complete flow in a single script:

```typescript
import { x402Client, x402HTTPClient, type PaymentRequired } from "@x402/fetch";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";
import {
  extractOffersFromPaymentRequired,
  decodeSignedOffers,
  extractReceiptFromResponse,
  extractReceiptPayload,
  verifyReceiptMatchesOffer,
  verifyOfferSignatureJWS,
  verifyOfferSignatureEIP712,
  verifyReceiptSignatureJWS,
  verifyReceiptSignatureEIP712,
  isJWSSignedOffer,
  isJWSSignedReceipt,
} from "@x402/extensions/offer-receipt";

const evmSigner = privateKeyToAccount(process.env.EVM_PRIVATE_KEY as `0x${string}`); // replace with your current wallet provider
const client = new x402Client();
registerExactEvmScheme(client, { signer: evmSigner });
const httpClient = new x402HTTPClient(client);

const url = "https://api.example.com/premium-data";

// 1. Get payment requirements and offers
const initialResponse = await fetch(url);
const paymentRequired = httpClient.getPaymentRequiredResponse(
  (name) => initialResponse.headers.get(name),
  (await initialResponse.json()) as PaymentRequired,
);
const offers = decodeSignedOffers(extractOffersFromPaymentRequired(paymentRequired));

// 2. Verify and select an offer
const selected = offers[0];
if (isJWSSignedOffer(selected.signedOffer)) {
  await verifyOfferSignatureJWS(selected.signedOffer);
} else {
  await verifyOfferSignatureEIP712(selected.signedOffer);
}

// 3. Pay and get receipt
const paymentPayload = await client.createPaymentPayload(paymentRequired);
const paidResponse = await fetch(url, {
  headers: httpClient.encodePaymentSignatureHeader(paymentPayload),
});
const receipt = extractReceiptFromResponse(paidResponse);

// 4. Verify receipt
if (isJWSSignedReceipt(receipt)) {
  await verifyReceiptSignatureJWS(receipt);
} else {
  await verifyReceiptSignatureEIP712(receipt);
}
verifyReceiptMatchesOffer(receipt, selected, [evmSigner.address]);

// 5. Build attestation with receipt proof
const attestation = {
  attester: `did:pkh:eip155:1:${evmSigner.address}`,
  subject: "did:web:api.example.com",
  issuedAt: Math.floor(Date.now() / 1000),
  ratingValue: 5,
  reviewBody: "Reliable service with fast response times.",
  proofs: [
    {
      proofType: "x402-receipt",
      proofPurpose: "commercial-tx",
      proofObject: receipt,
    },
  ],
};

console.log("User Review attestation ready:", JSON.stringify(attestation, null, 2));
```

## Further Reading

- [Resource Server Integration](./resource-server) — Set up offer-receipt signing on your server
- [x402 Overview](./overview) — How x402 and OMATrust fit together
- [Attestation Types](/reputation/attestation-types) — User Review schema and proof types
- [Verification Flow](/reputation/verification-flow) — How proofs are verified
- [Client Example](https://github.com/coinbase/x402/tree/main/examples/typescript/clients/offer-receipt) — Complete working client in the x402 repo
- [OMATrust Reputation Portal](https://github.com/oma3dao/rep-attestation-frontend) — Reference implementation showing how the OMATrust front end submits User Review attestations

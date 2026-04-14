---
title: Review Widget Overview
sidebar_position: 1
---

# OMATrust Review Widget

The OMATrust review widget is an embeddable iframe that lets users rate web3 apps directly within the apps themselves. The widget automatically generates on-chain proofs of the user's interaction with the app and allows them to sign reviews with the same wallet they already use when using the app. Reviews are submitted as EAS attestations via the OMATrust delegated attestation API — the user never leaves the app to write a review.

## How it works

1. The developer enters their app URL, contract address, and chain ID in the [widget builder](https://reputation.omatrust.org/widgets/reviews/create)
2. The builder generates an iframe snippet
3. The developer pastes the snippet into their site
4. Users open the widget, rate the app, and sign an EAS attestation with their wallet
5. The widget submits the signed attestation to the OMATrust relay server, which pays gas on behalf of the user

The widget checks if the user's wallet has interacted with the app's contract on-chain. If it has, the review is labeled **Verified User** and includes a `tx-interaction` proof.

## Signing modes

The widget supports two signing modes. Both are designed to give the user the same wallet experience they already have when using the app — the review process should feel native, not foreign.

### Basic mode

The widget handles wallet connection and signing inside the iframe using standard crypto-native wallet UIs (MetaMask, Coinbase Wallet, WalletConnect, etc.).

If your app's typical user experience involves connecting a browser extension wallet or scanning a WalletConnect QR code — like Safe Global, Uniswap, or Aave — basic mode matches that experience. The user connects in the widget the same way they connect everywhere else. No additional integration is needed beyond pasting the iframe snippet.

→ [Basic Mode Guide](/widgets/basic-mode)

### Integrated mode

The widget sends the EIP-712 attestation payload to the host page via `postMessage`. The host page uses its own wallet integration to prompt the user to sign, then sends the signature back to the widget. The widget never shows a wallet UI.

This is necessary when the app uses a wallet that can't be reproduced inside an iframe — social login wallets, embedded wallets, account abstraction, or any custodial/hosted wallet where the signing context is managed by the host page. In these cases, basic mode would present the user with a completely different wallet experience than what they're used to in the app. Integrated mode avoids that by delegating signing to the host, keeping the experience consistent.

Integrated mode requires adding a small signing bridge (~10 lines of code) to the host page using the `@oma3/omatrust` SDK.

→ [Integrated Mode Guide](/widgets/integrated-mode)

## Binding your contract to your domain

The widget typically collects reviews under a `did:web` subject derived from your app's domain (e.g., `did:web:myapp.com`). The proof check verifies the reviewer's wallet interacted with the contract address you configured. But for third-party consumers (scanners, agents, wallets) to trust that the contract actually belongs to your domain, you need a **Linked Identifier** attestation on EAS that binds the two together.

Without this binding, reviews still exist on-chain but cannot be independently verified as belonging to your app.

### What is a Linked Identifier?

A Linked Identifier attestation asserts that two DIDs are controlled by the same entity. For the widget, this means linking:

- **Subject**: `did:web:myapp.com` (your app's domain identity)
- **Linked ID**: `did:pkh:eip155:{chainId}:{contractAddress}` (your contract's on-chain identity)

This tells the OMATrust ecosystem: "this contract belongs to this domain."

### How to create the binding

There are two paths:

**OMA3 trusted binding** — Contact OMA3 to have the binding attestation issued on your behalf. OMA3 verifies your ownership and submits the Linked Identifier attestation. This is the fastest path for OMA3 member organizations.

**Self-serve binding** — Create the binding yourself using the [OMATrust attestation frontend](https://reputation.omatrust.org). You'll need to provide cryptographic proof that you control both the domain and the contract. Options include DNS TXT records, DID documents, or wallet signatures from a controlling wallet.

For full details on the Linked Identifier schema and proof requirements, see [Attestation Types — Linked Identifier](/reputation/attestation-types#linked-identifier).

### When to create the binding

You can embed the widget and start collecting reviews immediately — the binding is not required at review time. But you should complete the binding before you expect third parties to consume your reviews. Reviews collected before the binding exists will become verifiable as soon as the binding is created.

## Identity model

The widget constructs a `did:web` subject from the app's domain automatically — the developer just enters a URL. Reviews accumulate under this subject on EAS. The contract address in the embed snippet is used for proof checking only. The binding between domain and contract is handled by the Linked Identifier attestation described above.

---
title: Portal Overview
---

# OMATrust Portal

The OMATrust Portal at [app.omatrust.org](https://app.omatrust.org) is the web-based interface for interacting with the OMATrust reputation layer. You can publish attestations, submit reviews, and manage your service's reputation — all from your browser.

## What You Can Do

- **Publish attestations** — Submit security audits, compliance certifications, endorsements, and user reviews through a guided form
- **Manage your reputation** — Authorize signing keys, respond to user reviews, publish certifications
- **View reputation** — *(Coming soon)* Look up any service's on-chain attestations and trust score

## How It Works

The portal uses a **delegated attestation flow** — you sign your attestation data with your wallet, and the OMATrust backend submits the transaction on-chain on your behalf. This means:

- **No gas fees** — You don't need OMA tokens to use the portal
- **No network switching** — The delegated flow handles chain interactions for you
- **Same cryptographic guarantees** — Your attestation is still signed by your wallet and verifiable on-chain

When OMA token is available to the public, the portal will also support direct gas transactions for users who prefer to submit attestations on-chain themselves.

## Sign-In Options

The portal supports two ways to authenticate:

1. **Social login** — Sign in with Google, email, or other social providers using an embedded wallet. No crypto wallet needed.
2. **Self-custody wallet** — Connect your own EVM wallet (MetaMask, Rabby, Coinbase Wallet, etc.) for full control over your signing key.

Both options produce valid on-chain attestations. Choose social login for convenience, or a self-custody wallet if you want attestations tied to a key you fully control.

## Prerequisites

- A browser
- Either a social login account (Google, email) or an EVM-compatible self-custody wallet

That's it — no tokens, no network configuration required for the delegated flow.

## Getting Started

1. [Connect your wallet or sign in](/portal/connect-wallet)
2. [Publish your first attestation](/portal/publish-attestation)

## When You Need OMAChain in Your Wallet

If you're using the [SDK](/sdk/getting-started) to submit attestations directly on-chain (not through the portal's delegated flow), you'll need OMAChain configured in your wallet. See [Add OMAChain to Your Wallet](/portal/add-omachain-wallet) for those instructions.

---
title: Add OMAChain to Your Wallet
---

# Add OMAChain to Your Wallet

:::info
If you're using the [OMATrust Portal](https://app.omatrust.org) with the delegated attestation flow, you don't need to add OMAChain to your wallet. This page is for developers submitting transactions directly on-chain via the SDK or other tools.
:::

When submitting attestations directly on-chain (bypassing the portal's delegated flow), your wallet needs to know about OMAChain. The SDK or your dapp will attempt to add the network automatically using `wallet_addEthereumChain`. Wallets like MetaMask, Rabby, and Coinbase Wallet handle this natively — you'll see a confirmation dialog and just need to approve it.

If your wallet doesn't support automatic network addition, or the prompt doesn't appear, add the network manually using the parameters below.

## OMAChain Mainnet Parameters

| Parameter | Value |
|---|---|
| **Network Name** | OMAChain Mainnet |
| **Chain ID** | `6623` |
| **RPC URL** | `https://rpc.omachain.org/` |
| **Currency Symbol** | OMA |
| **Decimals** | 18 |
| **Block Explorer** | `https://explorer.omachain.org/` |

## Manual Setup

If your wallet requires manual network configuration:

1. Open your wallet's network settings (usually Settings → Networks → Add Network)
2. Enter each parameter from the table above
3. Save the network
4. Switch to "OMAChain Mainnet" as your active network

The exact steps vary by wallet, but all EVM wallets support adding custom networks with these parameters.

## Troubleshooting

**"Chain ID already exists"** — Your wallet may already have OMAChain configured. Check your network list and switch to it.

**RPC connection errors** — Verify the RPC URL is exactly `https://rpc.omachain.org/` with no trailing spaces.

**Wallet doesn't support custom networks** — Some mobile wallets or hardware wallet interfaces have limited network support. Consider using a browser extension wallet like MetaMask or Rabby for direct on-chain interactions.

## Next Steps

- [SDK Getting Started](/sdk/getting-started) — Submit attestations programmatically
- [OMATrust Portal](/portal/overview) — Use the gasless delegated flow instead

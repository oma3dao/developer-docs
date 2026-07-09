---
title: Connect Your Wallet
---

# Connect or Sign In

The OMATrust Portal supports two authentication methods. Choose whichever fits your workflow.

## Option 1: Social Login (Embedded Wallet)

1. Go to [app.omatrust.org](https://app.omatrust.org)
2. Click **Sign In**
3. Choose a social provider (Google, email, etc.)
4. An embedded wallet is created for you automatically

This is the fastest path — no wallet extension or crypto experience needed. The embedded wallet signs attestations on your behalf, and the delegated flow submits them on-chain without gas fees.

## Option 2: Self-Custody Wallet

1. Go to [app.omatrust.org](https://app.omatrust.org)
2. Click **Connect Wallet**
3. Select your wallet from the Thirdweb pop-up (MetaMask, Rabby, Coinbase Wallet, WalletConnect, etc.)
4. Approve the connection in your wallet

With a self-custody wallet, attestations are signed by a key you fully own and control. The portal still uses the delegated attestation flow, so no gas fees or network switching are required.

### If Your Wallet Doesn't Connect

Some wallets may not appear in the Thirdweb connection pop-up. If yours isn't listed:

- Try WalletConnect (most mobile wallets support it)
- Use a browser extension wallet like MetaMask or Rabby
- Fall back to social login and use the embedded wallet

## What Happens After You Connect

Once authenticated, the portal displays your account and you can begin publishing attestations. The delegated flow means all on-chain transactions are handled by the OMATrust backend — you just sign the data.

## Next Steps

- [Publish your first attestation](/portal/publish-attestation)
- Need OMAChain in your wallet for SDK usage? See [Add OMAChain to Your Wallet](/portal/add-omachain-wallet)

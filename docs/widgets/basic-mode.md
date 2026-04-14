---
title: Basic Mode
sidebar_position: 2
---

# Basic Mode

In basic mode, the widget handles wallet connection and signing inside the iframe. The developer's only job is to paste the iframe snippet into their site.

## Quick start

### 1. Generate the embed snippet

Go to the [widget builder](https://reputation.omatrust.org/widgets/reviews/create) and enter:

- **App URL** — your app's domain (e.g., `myapp.com`)
- **Contract address** — the contract your users transact with directly
- **Chain ID** — the EVM chain the contract is on

Click **Generate** and copy the iframe snippet.

### 2. Paste the snippet into your site

```html
<iframe
  id="omatrust-widget"
  src="https://reputation.omatrust.org/widgets/reviews/embed?url=myapp.com&contract=0x1234...&chainId=8453&name=My+App"
  width="400"
  height="640"
  style="border:0; width:100%; max-width:400px; background:transparent;"
  loading="lazy"
  title="OMATrust Review Widget"
></iframe>
```

That's it. The widget is live.

### 3. (Optional) Pass the user's wallet address

If your app already knows the user's wallet address, inject it into the iframe URL so the widget can run the proof check immediately:

```js
const iframe = document.getElementById("omatrust-widget");
const url = new URL(iframe.src);
url.searchParams.set("wallet", userWalletAddress);
iframe.src = url.toString();
```

Without this, the widget shows a **Connect** button and the user connects inside the iframe.

### 4. User writes a review

1. The user connects their wallet in the widget (or it's pre-populated via the `wallet` param)
2. The widget checks if the wallet has interacted with the configured contract
3. If yes, the review is labeled **Verified User**
4. The user selects a rating (1–5) and optionally writes review text
5. The user clicks **Sign and submit review**
6. A confirmation panel shows what the wallet will display
7. The wallet may prompt to switch to the attestation chain (OMAchain), then shows the EIP-712 signing prompt
8. The widget submits the signed attestation to the relay server
9. The widget shows the attestation UID and transaction hash

## Query parameters reference

| Param      | Required | Description                                                                              |
|------------|----------|------------------------------------------------------------------------------------------|
| `url`      | Yes      | App domain (e.g., `myapp.com`). The widget derives the `did:web:` subject automatically. |
| `contract` | Yes      | Contract address that users interact with directly.                                      |
| `chainId`  | Yes      | EVM chain ID where the contract lives.                                                   |
| `name`     | No       | Display name shown in the widget header.                                                 |
| `icon`     | No       | URL to an app icon shown in the widget header.                                           |
| `wallet`   | No       | Pre-populated wallet address for proof checking.                                         |
| `rpc`      | No       | Custom RPC endpoint. Only needed if the proof check fails for your chain.                |

## Contract address guidance

The contract address should be the contract your users transact with directly. The widget checks if the reviewer's wallet has sent at least one transaction to this contract.

Examples:
- **Game**: the game's main contract that players interact with
- **DeFi app**: the router or vault contract users swap/deposit through
- **NFT marketplace**: the marketplace contract users buy/sell on
- **OMATrust reputation frontend**: the EAS contract on OMAchain (for users who submit direct attestations)

## Proof check

The widget checks transaction history to verify the wallet has interacted with the configured contract:

```
from = wallet address
to   = configured contract address
```

If at least one matching transaction is found, the review includes a `tx-interaction` proof and is labeled **Verified User**. If no transaction is found, the user can still submit a review — it just won't have the verified badge.

## Supported wallets

Basic mode uses Thirdweb's `ConnectButton` configured for crypto-native wallets:

- MetaMask
- Coinbase Wallet
- Rainbow
- WalletConnect (connects to any compatible mobile wallet)

Social login wallets are not available in basic mode. If your app uses social or custodial wallets, use [integrated mode](/widgets/integrated-mode) instead.

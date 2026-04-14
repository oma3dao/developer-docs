---
title: Integrated Mode
sidebar_position: 3
---

# Integrated Mode

In integrated mode, the host page handles EIP-712 signing on behalf of the widget via a `postMessage` bridge. The widget never shows a wallet UI. The user stays in the same wallet context they already have on the host page.

## Quick start

### 1. Generate the embed snippet

Same as basic mode — use the [widget builder](https://reputation.omatrust.org/widgets/reviews/create) to generate the iframe snippet.

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

### 3. Pass the user's wallet address

Since the host page already has the user's wallet, inject it into the iframe URL:

```js
const iframe = document.getElementById("omatrust-widget");
const url = new URL(iframe.src);
url.searchParams.set("wallet", userWalletAddress);
iframe.src = url.toString();
```

### 4. Add the signing bridge

Install the SDK:

```bash
npm install @oma3/omatrust
```

Add the bridge to your page. The bridge listens for signing requests from the widget and forwards them to your app's wallet:

```ts
import { createSigningBridge } from "@oma3/omatrust/widgets";

const bridge = await createSigningBridge({
  iframeId: "omatrust-widget",
  signTypedData: async (domain, types, message) => {
    // Replace this with your app's wallet signing call.
    return await signer.signTypedData(domain, types, message);
  },
});
```

The `signTypedData` callback is where you connect the bridge to your wallet library. Here are examples for common libraries:

#### Thirdweb

```ts
import { ethers6Adapter } from "thirdweb/adapters/ethers6";

const bridge = createSigningBridge({
  iframeId: "omatrust-widget",
  signTypedData: async (domain, types, message) => {
    const signer = ethers6Adapter.signer.toEthers({ client, chain, account });
    return await signer.signTypedData(domain, types, message);
  },
});
```

#### wagmi / viem

```ts
import { useWalletClient } from "wagmi";

const { data: walletClient } = useWalletClient();

const bridge = createSigningBridge({
  iframeId: "omatrust-widget",
  signTypedData: async (domain, types, message) => {
    return await walletClient.signTypedData({
      domain,
      types,
      primaryType: "Attest",
      message,
    });
  },
});
```

#### ethers v6

```ts
const bridge = createSigningBridge({
  iframeId: "omatrust-widget",
  signTypedData: async (domain, types, message) => {
    return await signer.signTypedData(domain, types, message);
  },
});
```

### 5. Clean up

Remove the bridge when the component unmounts or the page navigates away:

```ts
bridge.destroy();
```

### 6. User writes a review

1. The widget loads and detects integrated mode (the bridge responds to the handshake)
2. The widget uses the wallet address from the `wallet` query param for the proof check
3. The user selects a rating and optionally writes review text
4. The user clicks **Sign and submit review**
5. The widget sends the EIP-712 typed data to the host via `postMessage`
6. The bridge validates the request, then calls your `signTypedData` callback
7. Your wallet prompts the user to approve the signature
8. The bridge sends the signature back to the widget
9. The widget submits the signed attestation to the relay server
10. The widget shows the attestation UID and transaction hash

## How mode detection works

The widget detects which mode to use automatically:

1. On load, the widget sends `omatrust:ready` to the parent window and retries at 500ms, 1s, and 2s
2. If the bridge responds with `omatrust:hostReady` within 3 seconds, the widget uses integrated mode
3. If no response after 3 seconds, the widget falls back to basic mode

If your page creates the bridge before the iframe finishes loading, the bridge responds to `omatrust:ready` as soon as the widget sends it. No timing issues.

## `createSigningBridge` API

```ts
function createSigningBridge(options: SigningBridgeOptions): SigningBridge;
```

### Options

| Option              | Type                                          | Required | Description                                                                       |
|---------------------|-----------------------------------------------|----------|-----------------------------------------------------------------------------------|
| `iframeId`          | `string`                                      | Yes      | The ID of the iframe element containing the widget.                               |
| `signTypedData`     | `(domain, types, message) => Promise<string>` | Yes      | Callback to sign EIP-712 typed data. Must return the hex signature.               |
| `devOriginOverride` | `string`                                      | No       | Override origin for local dev (e.g., `http://localhost:3000`). In production, origin is derived from the OMA3 trust policy. |

### Return value

| Property  | Type         | Description                                   |
|-----------|--------------|-----------------------------------------------|
| `destroy` | `() => void` | Removes all event listeners. Call on cleanup.  |

## Security

The `postMessage` bridge is an untrusted channel in both directions. The signing flow has three independent validation layers to protect against malicious or compromised iframes and hosts.

### Three-layer validation

1. **Bridge validates before signing** — the SDK's `createSigningBridge` validates every signing request against EAS-specific rules before calling the host's wallet
2. **Widget validates after signing** — the widget recovers the signer address from the EIP-712 signature and confirms it matches the wallet used for the proof check
3. **Relay server validates before submitting** — the delegated attestation API independently verifies the signature, schema allowlist, nonce, and deadline before submitting on-chain

### What the bridge validates

The `createSigningBridge` function checks every incoming request before calling the wallet. If any check fails, the bridge sends an error back to the widget and never calls the wallet.

| Check                        | Expected value                                |
|------------------------------|-----------------------------------------------|
| `domain.name`                | `"EAS"`                                       |
| `domain.version`             | `"1.4.0"`                                     |
| `domain.chainId`             | Positive integer                              |
| `domain.verifyingContract`   | Valid hex address (0x + 40 hex chars)          |
| `message.schema`             | Valid bytes32 hex string (0x + 64 hex chars)   |
| `message.attester`           | Valid hex address                              |
| `message.deadline`           | In the future                                  |

### Cross-origin message security

The bridge validates message origin and source:

- If `allowedOrigin` is set, messages from other origins are silently ignored
- The bridge verifies `event.source` against the iframe element resolved by `document.getElementById(iframeId)` at message time — only messages from the widget iframe are processed, even if the iframe remounts
- Every signing request uses a unique UUID for request/response correlation

## postMessage protocol

For developers who want to implement the bridge manually without the SDK:

```
Widget → Host:   { type: "omatrust:ready" }
Host → Widget:   { type: "omatrust:hostReady" }

Widget → Host:   { type: "omatrust:signTypedData", id, domain, types, message }
Host → Widget:   { type: "omatrust:signature", id, signature }
Host → Widget:   { type: "omatrust:signatureError", id, error }
```

All `id` values are UUIDs generated by the widget. The host must echo the same `id` in its response.

The bridge validates every signing request against EAS-specific rules before calling the wallet. See the [Security](#security) section above for the full validation table.

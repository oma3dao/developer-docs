---
id: tokenized-app
title: Tokenized Applications
sidebar_position: 2
---

# What is a Tokenized Application?

A tokenized application is an **ERC-721 NFT** with standardized metadata that describes the app, its ownership, and how it should be presented or launched. Below is a breakdown of each metadata field:

| Field | Description |
|-------|-------------|
| `name` | The application name (max 32 bytes). |
| `version` | Version number in `x.y.z` format (e.g., `1.0.0`). |
| `DID` | A [Decentralized Identifier](https://www.w3.org/TR/did-core/), often in the format `did:web:websiteurl`. Proves app identity. |
| `dataUrl` | A GraphQL-compatible endpoint returning offchain metadata like app icon, screenshots, description, and marketing site. |
| `iwpsPortalUri` | The first API endpoint the app store hits when launching the app, as defined in the [IWPS spec](https://github.com/oma3dao/iwps-specification). |
| `agentApiUri` | *(Optional)* Reserved for future agent-based interactions. |
| `contractAddress` | A [CAIP-2](https://chainagnostic.org/CAIPs/caip-2) compliant blockchain address of the app’s associated smart contract. |

## Example `dataUrl` Response

```json
{
  "description": "A very cool app.",
  "iconUrl": "https://spatialstore.myworld.com/dataurl/appicon.png",
  "screenShotsUrl": [
    "https://spatialstore.world.com/dataurl/screenshots/1.png",
    "https://spatialstore.world.com/dataurl/screenshots/2.png"
  ],
  "marketingUrl": "https://www.myworld.com"
}
```

## Metadata Usage Summary

- `iwpsPortalUri`: Used as the launch entry point in the IWPS protocol
- `dataUrl`: Displays app details like icons and screenshots
- `DID`: Binds the app’s identity to a verifiable domain
- `agentApiUri`: Reserved for machine interactions (future)

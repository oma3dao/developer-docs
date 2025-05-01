---
id: tokenized-app
title: Tokenized Applications
sidebar_position: 2
---

# What is a Tokenized Application?

A tokenized application is an **ERC-721 NFT** with standardized metadata extensions that describes the app, its ownership, and how it should be presented or launched. Below is a breakdown of each NFT field:

| Field | Description |
|-------|-------------|
| `name` | The application name (max 32 bytes). |
| `version` | Version number in `x.y.z` format (e.g., `1.0.0`). |
| `did` | A [Decentralized Identifier](https://www.w3.org/TR/did-core/), often in the format `did:web:websiteurl`. Proves app identity. |
| `dataUrl` | A GraphQL-compatible endpoint returning offchain metadata like app icon, screenshots, description, and marketing site. |
| `iwpsPortalUri` | The first API endpoint the app store hits when launching the app, as defined in the [IWPS spec](https://github.com/oma3dao/iwps-specification). |
| `agentApiUri` | *(Optional)* Reserved for future agent-based interactions. |
| `contractAddress` | A [CAIP-2](https://chainagnostic.org/CAIPs/caip-2) compliant blockchain address of the app's associated smart contract. |

## Example `dataUrl` Response

```json
{
  "descriptionUrl": "https://spatialstore.myworld.com/dataurl/description.txt",
  "iwpsUrl": "https://spatialstore.myworld.com/dataurl/iwps-url",
  "agentUrl": "https://spatialstore.myworld.com/dataurl/agent-url",
  "image": "https://spatialstore.myworld.com/dataurl/appicon.png",
  "screenshotUrls": [
    "https://spatialstore.myworld.com/dataurl/screenshot1.png",
    "https://spatialstore.myworld.com/dataurl/screenshot2.png"
  ],
  "external_url": "https://spatialstore.myworld.com/",
  "token": "eip155:1:0x1234567890abcdef",
  "platforms": {
    "web": {
      "url_launch": "https://spatialstore.myworld.com/play"
    },
    "ios": {
      "url_download": "https://apps.apple.com/app/id123456789",
      "url_launch": "https://spatialstore.myworld.com/play", 
      "supported": ["iPhone", "iPad", "VisionPro"]
    },
    "android": {
      "url_download": "https://play.google.com/store/apps/details?id=com.myworld.spatialstore", 
      "url_launch": "https://spatialstore.myworld.com/play" 
    }
  }  
}
```

## IWPS Integration

The Inter-World Portaling System (IWPS) is protocol that enables applications to be downloaded and launched across different operating systems and devices. Developers need to understand this protocol to effectively integrate with the tokenized application ecosystem.

### What is IWPS?

IWPS (Inter-World Portaling System) is an API specification that enables seamless teleportation between diverse virtual worlds, applications, and platforms. It provides the framework for building an "open metaverse" with features for identity management, asset transfer, and secure communications.

### Portal URI

The `iwpsPortalUri` field in tokenized applications is the entry point for the IWPS protocol:

**Format:** A standard URI that points to the application's portal endpoint

**Example:** `https://myapp.example.com/iwps/portal`

When a user wants to launch your application from another app or store, this URI is called with specific parameters to initiate the teleportation process.

### Key IWPS Components

The IWPS specification defines:

1. **Query API** - Allows applications to discover capabilities and requirements before teleporting
2. **Teleport API** - Facilitates the actual teleportation between worlds
3. **Authentication Mechanisms** - Ensures secure and trusted communications
4. **Identity Framework** - Standardizes user identity across different applications
5. **Asset Transfer Protocol** - Enables users to bring relevant assets between worlds

### Further Reading

For comprehensive implementation details, developers should review the complete [IWPS specification](https://github.com/oma3dao/iwps-specification) available in the OMA3 GitHub repository.

## Decentralized Identifiers (DIDs) in the App Registry

Decentralized Identifiers (DIDs) serve as the foundational component for establishing verifiable, decentralized digital identity for actors in the OMA3 registry. The App Registry currently does not disallow certain types of DIDs (called "DID methods" in the W3C standard) but we encourage use of the following:

### did:web

The `did:web` method links an application to a domain name, providing a familiar and accessible way to verify identity.

**Format:** `did:web:<domain-name>[:<path>]`

**Example:** `did:web:myapp.example.com`

`did:web` works by storing DID documents at well-known URLs, typically at `https://<domain-name>/.well-known/did.json`. This allows anyone to verify that the owner of the domain name is also the controller of the DID.  Ideally actors that use this DID are verfied that they actually own the domain.

### did:eth (and other blockchain-based methods)

The `did:eth` method uses Ethereum addresses as identifiers, leveraging the established Ethereum blockchain for decentralized identity.

**Format:** `did:eth:<ethereum-address>`

**Example:** `did:eth:0x71C7656EC7ab88b098defB751B7401B5f6d8976F`

This method is widespread in Web3 applications and provides a direct link between the application's identity and an Ethereum account. It enables cryptographic verification without requiring domain ownership, making it accessible for blockchain-native applications and developers.

---
id: registration-guide
title: Registration Guide
sidebar_position: 4
---

# App Registration Guide

This guide walks you through the process of registering your application with the OMA3 App Registry. By tokenizing your application, you'll make it discoverable and launchable across the open metaverse ecosystem.

## Wallet Setup

Before registering your app, you'll need to set up a blockchain wallet that supports the networks where the App Registry is deployed.

We've tested extensively with MetaMask Mobile, but any wallet that allows entering custom chain information should work fine. Future documentation will include more specific wallet recommendations.

### Testnet Configuration

For development and testing we plan to deploy on multiple testnets but for now the only one we support is the Celo Alfajores testnet:

1. **Add Alfajores Testnet**:
   - Network Name: `Celo Alfajores Testnet`
   - RPC URL: `https://alfajores-forno.celo-testnet.org`
   - Chain ID: `44787`
   - Currency Symbol: `CELO`
   - Block Explorer: `https://alfajores.celoscan.io`

2. **Get Testnet Tokens**:
   - Visit the [Alfajores Faucet](https://faucet.celo.org/alfajores)
   - Connect your wallet or paste your wallet address
   - Request test CELO tokens (you can get more by signing in with GitHub)

## How the Registry Handles Wallet Identities

The App Registry smart contract has important security features that determine how wallets interact with application tokens:

### Ownership Model

- **Soulbound Tokens**: App tokens are "soulbound" to the wallet address that registered them
- **Non-transferable**: App tokens cannot be transferred to other wallets (unlike standard NFTs).  This may change in the future and we certainly anticipate other ERC721 contracts will be deployed without this restriction.
- **Metadata Authority**: Only the original minter can update app metadata

### Wallet Verification

- The smart contract uses `msg.sender` to verify the identity of the wallet interacting with the app token
- All app token operations (minting, metadata updates, status changes) require a valid signature from the owner wallet
- There is no recovery mechanism if wallet access is lost, so secure your wallet credentials

## Registration Process

### Step 1: Decide Your Hosting Strategy

The first and most important decision is whether you'll self-host your application's Data URL and Portal URI endpoints or use OMA3-provided infrastructure.

#### Self-Hosting

Self-hosting your endpoints provides:
- **Enhanced Security**: Full control over your infrastructure security
- **Reliability**: No dependency on third-party hosting services
- **Complete Control**: Update your metadata whenever needed
- **Custom Implementation**: Build advanced features into your endpoints

To self-host:
- Set up endpoints on your web server that implement the required API formats
- Ensure your servers have high availability
- Implement proper security measures (HTTPS, rate limiting, validation)

#### Default Hosting

Using OMA3's default hosting provides:
- **Simplified Setup**: No need to create your own endpoints
- **Managed Service**: Infrastructure maintained by OMA3
- **Basic Features**: Supports standard metadata fields
- **Trade-offs**: Less control over updates and features

### Step 2: Plan Your Registration

Before starting the registration process, gather the necessary information based on your hosting strategy.

#### For All Applications (Required Fields)

| Field | Requirements | Example |
|-------|--------------|---------|
| App Name | Up to 32 bytes | "Metaverse Explorer" |
| Version | Format x.y.z | "1.0.0" |
| DID | Decentralized Identifier | `did:web:myapp.example.com` |
| IWPS Portal URI | Endpoint for app launching | `https://app.example.com/iwps/portal` |
| Data URL | Metadata endpoint | `https://metadata.example.com/app/123` |

#### For All Applications (Optional Fields)

| Field | Requirements | Example |
|-------|--------------|---------|
| Agent API URI | For agent integrations | `https://api.example.com/agent` |
| Contract Address | CAIP-2 address for blockchain-based games | `eip155:1:0x123...789` |

#### For Default Hosting (Additional Metadata)

If you're using OMA3's default hosting, you'll also need to provide these metadata fields directly during registration:

| Metadata Field | Description | Example |
|----------------|-------------|---------|
| Description URL | URL to a plain text file (e.g.- .txt) that contains a brief app description | "An immersive metaverse exploration app" |
| Icon URL | URL to app icon (PNG/JPG) with max resolution of 1024x1024| See hosting options below |
| Screenshots | URLs to app screenshots (up to 5) with max resolution of 2048x2048| See hosting options below |
| Marketing URL | Link to your app's website | `https://www.example.com` |
| Token Contract Address | [CAIP-2](https://chainagnostic.org/CAIPs/caip-2) address of your token contract (separate from application's smart contract) | `eip155:1:0x123...789` |
| Platform URLs | Links to download and launch your app on different platforms | `https://apps.apple.com/app/id123456789` |

For hosting app icons and screenshots, see the [Metadata Hosting Options](#metadata-hosting-options) section below.

### Step 3: Register Your App

1. Visit [appregistry.oma3.org](https://appregistry.oma3.org)
2. Connect your wallet (ensure you're on the correct network)
3. Click **Register App** to open the registration form
4. Fill in the fields and submit
4. Your wallet will prompt you to sign the transaction
5. Pay the required gas fee
6. Wait for transaction confirmation
7. If you are choosing default URLs and OMA3 hosting, continue to other steps.  At step 5 you will be asked to sign another transaction.

Here is a more detailed description of each field

#### Name and Version

Enter your application name (max 32 bytes) and version number in `x.y.z` format.

#### Decentralized Identifier (DID)

Your DID creates a verifiable link between your app and its identity. Choose a DID method:

- **did:web**: Link to your domain (e.g., `did:web:myapp.example.com`)
- **did:eth**: Link to your Ethereum address (e.g., `did:eth:0x123...789`)
- **did:key**: Use a public key without external dependencies

For `did:web`, ensure you publish a DID document at `https://<domain>/.well-known/did.json`.

#### IWPS Portal URI

This is the endpoint that will be called when a user launches your app from a compatible store. This URI must:

- Be publicly accessible
- Implement the IWPS Query API
- Handle the parameters defined in the IWPS specification

#### Data URL

This endpoint provides extended metadata about your app:

- Must return a JSON response with the correct format. See the [Example DataURL Response](#example-dataurl-response) below.
- Should include app description, icons, screenshots, etc.
- Should be hosted on a reliable service

#### Optional Fields

- **Agent API URI**: For future agent-based interactions (can be left blank)
- **Contract Address**: If your app has an associated smart contract (e.g.- blockchain based games), in CAIP-2 format

### Example DataURL Response

Your DataURL endpoint should return a JSON response similar to this:

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

## Metadata Hosting Options

### Self-Hosted Options

You can host metadata on:
- Your own web server (ensure high uptime)
- Cloud services like AWS S3 or Google Cloud Storage
- IPFS via Pinata or nft.storage (for decentralized hosting)

### Security Considerations

When hosting your metadata and implementing IWPS endpoints:

- **HTTPS Required**: All endpoints must use HTTPS
- **CORS Headers**: Set appropriate CORS headers for cross-domain access
- **Rate Limiting**: Implement rate limiting to prevent abuse
- **Input Validation**: Validate all input parameters
- **Monitoring**: Set up monitoring for your endpoints

### Cloudinary

We have had success with [Cloudinary](https://cloudinary.com/) although the setup isn't straight forward:
- Free tier with generous limits
- Image optimization and transformation
- Global CDN for fast loading
- Reliability and uptime

Here's a [Cloudinary Guide](./cloudinary-guide):

By default, Cloudinary generates a random `public_id` (e.g. `v16839038/k3jhsdf8321`), but you can override this to make URLs easier to reference in metadata.

#### Example Structure

Use a format like: 

`apps/your-app-slug/filename`

Examples:
- `apps/mycoolapp/icon`
- `apps/mycoolapp/screenshot-1`
- `apps/mycoolapp/screenshot-2`

This creates image URLs like:

`https://res.cloudinary.com/your-cloud-name/image/upload/apps/mycoolapp/icon.png`


1. Go to [Cloudinary Media Library](https://console.cloudinary.com/)
2. Click "Upload"
3. Choose your image
4. Under "Public ID", enter: `apps/mycoolapp/icon`
5. Click "Advanced" if needed to disable automatic unique suffixes

Once uploaded, your image will be available at:

`https://res.cloudinary.com/your-cloud-name/image/upload/apps/mycoolapp/icon.png`

Replace `your-cloud-name` with your actual Cloudinary account name.

## Future Roadmap

The App Registry is evolving so be aware of these coming changes while we're on testnet:

- **Metadata Contract Migration**: Moving fields between the app registry and app metadata contracts
- **ERC721 Extension**: Proposing a formal standard for tokenized applications
- **Custom Registries**: Support for developer-deployed registry instances

## Troubleshooting

### Common Issues

| Problem | Solution |
|---------|----------|
| Transaction fails | Ensure you have enough gas (native token) in your wallet |
| DID already exists | Each DID must be unique; choose a different identifier |
| Metadata not appearing | Verify your DataURL is accessible and returns valid JSON |
| Portal URI unreachable | Check that your IWPS endpoint is publicly accessible |

### Support Resources

- [GitHub Issues](https://github.com/oma3dao/developer-docs-alt/issues) - Technical issues and bug reports
- [Documentation Repository](https://github.com/oma3dao/developer-docs-alt) - Latest documentation updates

## Learn More

- [Join OMA3](https://www.oma3.org/join)
- [OMA3 Intellectual Property Rights Policy](https://www.oma3.org/intellectual-property-rights-policy)
- [IWPS Specification](https://github.com/oma3dao/iwps-specification)

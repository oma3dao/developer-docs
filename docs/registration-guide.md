---
id: registration-guide
title: Registration Guide
sidebar_position: 5
---

# Service Registration Guide

:::caution Draft Documentation
Registration process and UI may change. Screenshots and specific steps may differ from current implementation. For the most accurate walkthrough, use the wizard at [registry.omatrust.org](https://registry.omatrust.org).
:::

This guide walks you through registering your service (website, API, smart contract, or AI agent) with the OMATrust App Registry.

## Prerequisites

### 1. Wallet Setup

You'll need a Web3 wallet that supports custom networks:

**Recommended Wallets:**
- MetaMask (browser extension or mobile)
- Coinbase Wallet
- WalletConnect-compatible wallets

**Or use social login:**
- Google, Apple, Facebook (via Thirdweb embedded wallets)
- Email + passkey

### 2. Network Configuration

**For Testnet (Development):**

Add OMAchain Testnet to your wallet:
- **Network Name:** OMAchain Testnet
- **RPC URL:** https://rpc.testnet.chain.oma3.org/
- **Chain ID:** 66238
- **Currency Symbol:** OMA
- **Explorer:** https://explorer.testnet.chain.oma3.org/

**Get Test Tokens:**
- Visit [https://faucet.testnet.chain.oma3.org/](https://faucet.testnet.chain.oma3.org/)
- Request OMA tokens (free for testing)

### 3. Decide What to Register

Determine your service type:

| Service Type | Interface | DID Type | Key Features |
|--------------|-----------|----------|--------------|
| Website/Web App | Human | did:web | Domain verification, screenshots |
| API Service | API | did:web | Endpoint, schema, API type |
| MCP Server | API | did:web | MCP config, tools, resources |
| A2A Agent | API | did:web | Agent card URL |
| Smart Contract | Contract | did:pkh | Chain + address in DID |
| Downloadable App | Human | did:web | Platform binaries, artifacts |

## Registration Process

### Step 1: Connect Wallet

1. Go to [https://registry.omatrust.org](https://registry.omatrust.org)
2. Click **"Get Started"**
3. Choose connection method:
   - MetaMask or other wallet
   - Social login (Google, Apple, email)
4. Approve connection

You'll be redirected to the dashboard.

### Step 2: Open Registration Wizard

Click **"Register New App"** button

The wizard opens with 6-8 steps (depending on selected interfaces).

### Step 3: Verification & Interface Selection

**Required Fields:**
- **App Name** - Display name (e.g., "My API Service")
- **Version** - Semantic version (e.g., "1.0.0" or "1.0")
- **DID Type** - Choose did:web or did:pkh
- **DID** - Your identifier
  - did:web: `did:web:example.com` (domain-based)
  - did:pkh: `did:pkh:eip155:1:0xContractAddress` (blockchain-based)

**Interface Selection:**
- ☑ **Human** - For websites, apps with GUI
- ☑ **API** - For programmatic services
  - If checked: Select API type (OpenAPI, GraphQL, MCP, A2A, JSON-RPC)
- ☑ **Smart Contract** - For on-chain applications

**DID Verification:**
- Click "Verify DID Ownership"
- For did:web: Server checks `.well-known/did.json`
- For did:pkh: Server verifies contract ownership
- Attestation issued automatically
- Wait for "✅ Verified" status

### Step 4: On-Chain Data

**Data URL:**
- Auto-generated: `https://registry.omatrust.org/api/data-url/{did}/v/{version}`
- Or customize to host your own

**Optional Fields:**
- **Contract ID** - CAIP-10 address (e.g., `eip155:1:0x123...`)
- **Fungible Token ID** - CAIP-19 token (e.g., `eip155:1/erc20:0x123...`)
- **Traits** - Searchable tags (suggestions provided based on interface type)

**Traits auto-added:**
- API type: `api:mcp`, `api:rest`, etc.
- Add more: `gaming`, `defi`, `pay:x402`, etc.

### Step 5: Common Metadata

**Required:**
- **Description** - Concise description (markdown supported)
- **Image** (if Human) - App icon URL (1024x1024 recommended)
- **Publisher** (if API/Contract) - Organization name

**Optional:**
- **Summary** - Short tagline (80 chars max)
- **External URL** - Marketing/homepage
- **Legal URL** - Terms, privacy policy
- **Support URL** - Help/documentation

### Step 6: Interface-Specific Fields

#### If Human Interface Selected:

**Step 6a: Media & Assets**
- **Screenshots** (required) - At least 1, up to 5
- **Video URLs** (optional) - Demos, trailers (up to 3)
- **3D Assets** (optional) - GLB, USDZ files for AR/VR (up to 3)

**Step 6b: Platform Distribution**
- **IWPS Portal URL** (optional) - Metaverse integration
- **Platforms** - Configure for each platform:
  - Web, iOS, Android, Windows, macOS, etc.
  - Download URL (for native apps)
  - Launch URL (for web apps)
  - Artifact verification (appears when download URL provided):
    - Artifact DID (content hash)
    - Architecture (x64 or ARM64)
    - Auto-detects: Type (binary) and OS

#### If API Interface Selected:

**Step 7: API Configuration**
- **Endpoint URL** (required) - Adapts based on API type:
  - MCP: "MCP Server URL"
  - A2A: "Agent Card URL"
  - GraphQL: "GraphQL Endpoint URL"
  - OpenAPI: "API Endpoint URL"
- **Schema URL** (optional) - Machine-readable schema preferred:
  - OpenAPI: Link to `openapi.json`
  - GraphQL: Link to SDL or introspection endpoint
  - A2A: Link to agent capabilities
- **Interface Versions** (optional) - Supported versions (e.g., "v1, v2")

**If MCP Selected:**
- **MCP Configuration** - Configure tools, resources, prompts:
  - Tools: Functions your MCP server provides
  - Resources: Data sources agents can access
  - Prompts: Pre-configured prompts
  - Transport & Authentication: Advanced settings

#### If Smart Contract Only:

**Step 7: Contract Endpoint (Optional)**
- **RPC Endpoint** - Recommend specific RPC for performance
- **Schema URL** - Link to ABI JSON or block explorer

### Step 8: Review & Mint

**Review all information:**
- Identifiers (DID, version, interfaces)
- Metadata fields
- Generated JSON preview
- Calculated dataHash

**Copy JSON (if using custom dataUrl):**
```json
{
  "name": "My Service",
  "description": "...",
  // ... all metadata
}
```

Host this JSON at your custom dataUrl endpoint.

**Click "Submit":**
- Single transaction mints registry NFT
- Metadata stored (if using default dataUrl)
- Attestations already issued (from Step 3)
- Done! Your service is now registered

## After Registration

### View Your Service

**On Dashboard:**
- See your registered service
- App card shows:
  - Name (from metadata)
  - Version
  - Interface badges (Human, API, Contract)
  - Status (Active by default)

**Click to view details:**
- Full metadata
- Data integrity status (✅ verified or ❌ mismatch)
- Attestation status (🛡️ if oracle verified)
- All fields displayed

### Update Metadata

**For default dataUrl:**
1. Click "Edit" on your app card
2. Update fields in wizard
3. Submit update transaction
4. New metadata stored on-chain
5. Version history updated

**For custom dataUrl:**
1. Update JSON at your endpoint
2. Compute new hash: `keccak256(jsonString)`
3. Call `setMetadataJson()` with new hash
4. Or use wizard "Edit" and it handles hashing

### Change Status

**Mark as deprecated:**
1. Open app details
2. Click "Change Status"
3. Select "Deprecated"
4. Approve transaction
5. App marked deprecated (still visible to you, hidden from public)

### Transfer Ownership

**Transfer NFT to new wallet:**
```typescript
await registry.transferFrom(yourAddress, newOwnerAddress, tokenId);
```

New owner can now update metadata and status.

## Troubleshooting

### "DID Verification Failed"

**Causes:**
- did:web: DID document not found at `/.well-known/did.json`
- did:web: Wallet address not in DID document
- did:pkh: Contract owner doesn't match wallet

**Solutions:**
- Verify DID document is accessible
- Check wallet address is correct
- For contracts: ensure you're the owner/admin

### "Transaction Failed"

**Common causes:**
- Insufficient gas
- DID already registered for this major version
- Validation errors (check all required fields)

**Solutions:**
- Get more OMA tokens from faucet (testnet)
- Check if app already exists: different major version needed
- Review error message for specific field issues

### "Data Hash Mismatch"

**Causes:**
- Metadata at dataUrl changed since registration
- Hash computed with different algorithm

**Solutions:**
- Re-calculate hash from current JSON
- Update dataHash via `setMetadataJson()`
- Or keep metadata unchanged

### "Attestation Not Found"

**Causes:**
- Oracle hasn't processed verification yet
- Maturation period hasn't passed (60 seconds)
- DID verification failed

**Solutions:**
- Wait 1-2 minutes and check again
- Re-run verification
- Check resolver logs

## Advanced Topics

### Custom DataUrl Hosting

**Requirements:**
- HTTPS endpoint
- Returns valid JSON
- High availability recommended
- CORS enabled for browser access

**Example endpoint (Express.js):**
```javascript
app.get('/metadata/:did/v/:version', (req, res) => {
  const metadata = {
    name: "My Service",
    description: "...",
    // ... all fields
  };
  
  res.json(metadata);
});
```

**Benefits:**
- Full control over metadata
- Update anytime without transactions
- Can add custom fields

**Trade-offs:**
- Must maintain infrastructure
- Availability is your responsibility

### Batch Registration

**For multiple services:**
```typescript
const services = [
  { did: "did:web:api1.example.com", ... },
  { did: "did:web:api2.example.com", ... },
  { did: "did:web:api3.example.com", ... },
];

for (const service of services) {
  await registry.mint(...service);
  await sleep(1000); // Rate limit
}
```

**Or use hardhat tasks:**
```bash
npx hardhat mint \
  --did "did:web:api.example.com" \
  --interfaces 2 \
  --dataurl "https://api.example.com/metadata" \
  --network omachainTestnet
```

### Programmatic Registration

**Using Thirdweb SDK:**
```typescript
import { prepareContractCall, sendTransaction } from 'thirdweb';
import { privateKeyToAccount } from 'thirdweb/wallets';

const registry = getContract({ address: registryAddress, abi });
const account = privateKeyToAccount({ privateKey });

const tx = prepareContractCall({
  contract: registry,
  method: 'mint',
  params: [
    did,
    interfaces,
    dataUrl,
    dataHash,
    dataHashAlgorithm,
    fungibleTokenId,
    contractId,
    major, minor, patch,
    traitHashes,
    metadataJson
  ]
});

const result = await sendTransaction({ transaction: tx, account });
```

## Next Steps

- **[Cookbooks](./cookbooks/register-website.md)** - Specific examples for your use case
- **[Client Integration](./client-guide.md)** - Query registered services
- **[Attestations](./attestations.md)** - Build trust through verification

---

**Ready to register?** Head to [registry.omatrust.org](https://registry.omatrust.org) and click "Get Started"!

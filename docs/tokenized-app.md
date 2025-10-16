---
id: tokenized-app
title: What is a Tokenized Service?
sidebar_position: 3
---

# What is a Tokenized Service?

:::caution Draft Documentation
This documentation is in **draft format** and subject to change. Field definitions and data structures may evolve. Verify against the [OMATrust Specification](https://github.com/oma3dao/omatrust-docs) for the latest details.
:::

A tokenized service in OMATrust is an **ERC-721 NFT** that represents a verifiable identity for any online service: websites, APIs, smart contracts, or AI agents. Each token includes standardized metadata that enables discovery, verification, and trust-building.

## Token Structure

Every tokenized service is an NFT with the following on-chain data:

| Field | Type | Description |
|-------|------|-------------|
| `did` | string | Decentralized Identifier (e.g., `did:web:example.com`) |
| `versionMajor` | uint8 | Major version number (indexed for lookups) |
| `versionHistory` | Version[] | Complete version history (major.minor.patch) |
| `interfaces` | uint16 | Bitmap: 1=Human, 2=API, 4=Contract |
| `dataUrl` | string | URL to off-chain metadata JSON |
| `dataHash` | bytes32 | Hash of metadata for integrity verification |
| `dataHashAlgorithm` | uint8 | Hash algorithm: 0=keccak256, 1=sha256 |
| `contractId` | string | CAIP-10 contract address (optional) |
| `fungibleTokenId` | string | CAIP-19 token ID (optional) |
| `traitHashes` | bytes32[] | Searchable tags (hashed) |
| `minter` | address | Original creator |
| `status` | uint8 | 0=Active, 1=Deprecated, 2=Replaced |

## Interface Types

Services can support one or more interface types:

### Human Interface (1)

**Target Audience:** End users interacting through GUI

**Use Cases:**
- Websites
- Mobile/desktop apps
- Web3 dApps
- Games
- VR/AR experiences

**Required Metadata:**
- App icon (1024x1024 recommended)
- Screenshots (at least 1, up to 5)
- Platform availability (web, iOS, Android, etc.)

**Optional Metadata:**
- Video URLs (demos, trailers)
- 3D assets (GLB, USDZ for AR/VR)
- IWPS portal URL (metaverse integration)

### API Interface (2)

**Target Audience:** Developers, bots, and AI agents

**Use Cases:**
- REST APIs
- GraphQL APIs
- JSON-RPC services
- MCP servers (Model Context Protocol)
- A2A agents (Agent-to-Agent)

**Required Metadata:**
- Endpoint URL
- API type (via traits: `api:rest`, `api:graphql`, `api:mcp`, etc.)

**Optional Metadata:**
- Schema URL (OpenAPI spec, GraphQL SDL, etc.)
- Interface versions (e.g., ["v1", "v2"])
- MCP configuration (tools, resources, prompts)

### Smart Contract Interface (4)

**Target Audience:** On-chain applications

**Use Cases:**
- DeFi protocols
- NFT contracts
- DAOs
- Token contracts

**Required Metadata:**
- Contract address (in contractId: `did:pkh:eip155:1:0xAddress`)

**Optional Metadata:**
- Recommended RPC endpoint
- ABI schema URL

### Combining Interfaces

Services can support multiple interfaces:

**Examples:**
- `interfaces = 3` (Human + API) - Web app with programmatic access
- `interfaces = 7` (All) - Full-stack dApp with contract backend

## Decentralized Identifiers (DIDs)

### did:web

**Format:** `did:web:<domain>[:<path>]`

**Example:** `did:web:api.example.com`

**Verification:** 
- Fetch `https://<domain>/.well-known/did.json`
- Verify wallet address in DID document
- Oracle attests ownership to resolver

**Best For:**
- Services with domains
- Websites and APIs
- Established brands

### did:pkh

**Format:** `did:pkh:<namespace>:<chainId>:<address>`

**Example:** `did:pkh:eip155:1:0x1234...5678`

**Verification:**
- Extract chain and address from DID
- Verify wallet controls contract
- Oracle attests ownership

**Best For:**
- Smart contracts
- On-chain applications
- Chain-native services

## Metadata Storage: On-Chain vs Off-Chain

### Off-Chain Metadata

**Approach:** Store JSON at `dataUrl`, store hash on-chain

```json
dataUrl: "https://example.com/metadata.json"
dataHash: "0xabc123..." (keccak256 of JSON)
```

**Benefits:**
- ✅ Gas efficient
- ✅ Large metadata (no size limits)
- ✅ Easy updates
- ✅ Verifiable via hash

**Trade-offs:**
- ❌ Requires hosting
- ❌ Availability risk (host could go down)

### On-Chain Metadata

**Approach:** Store JSON string via registry contract during update

```solidity
// Update app and store metadata atomically
registry.updateAppControlled(
    did, major, 
    newDataUrl, newDataHash, newDataHashAlgorithm,
    interfaces, traitHashes,
    newMinor, newPatch,
    jsonString  // Metadata stored if provided
)
```

**Note:** Metadata is stored atomically with app updates. The registry forwards to the metadata contract internally.

**Benefits:**
- ✅ Permanent storage
- ✅ No hosting needed
- ✅ Censorship resistant

**Trade-offs:**
- ❌ Expensive (gas costs)
- ❌ Size limits (~24KB practical limit)
- ❌ Must call via registry contract (not metadata contract directly)

### Choosing Your Approach

**Use on-chain metadata when:**
- You don't want to host your own dataUrl endpoint
- Metadata provenance is desired
- Small metadata size (< 10KB)
- Gas cost is not a concern

**Use off-chain metadata when:**
- Large metadata (multiple interfaces, many platform downloads, etc.)
- More control over the dataUrl endpoint is desired
- Want to minimize gas costs
- Have reliable hosting available


## Version Management

### Semantic Versioning

Format: `major.minor.patch`

**Major version changes:**
- Breaking changes to API
- Complete redesigns
- New contract deployment

**Minor version changes:**
- New features
- Non-breaking API additions
- Metadata updates

**Patch version changes:**
- Bug fixes
- Documentation updates
- Cosmetic changes

### Version History

**Storage:**
```solidity
struct Version {
  uint8 major;
  uint8 minor;
  uint8 patch;
}

App.versionHistory: Version[] // [1.0.0, 1.5.0, 2.0.0]
```

**Querying:**
```typescript
// Get app by DID + major version
const app = await registry.getApp("did:web:example.com", 2);  // Major version = 2

// Version history includes all minor/patch updates
app.versionHistory // [2.0.0, 2.0.1, 2.1.0]
```

### Events for Historical Tracking

```solidity
event VersionAdded(
  bytes32 indexed didHash,
  uint8 indexed major,
  uint256 indexed tokenId,
  uint8 minor,
  uint8 patch
);

event MetadataSet(
  string indexed did,
  uint8 major,
  uint8 minor,
  uint8 patch,
  bytes32 dataHash,
  uint256 timestamp
);
```

**Use events to:**
- Reconstruct version timeline
- Audit metadata changes
- Track update frequency

## Trait-Based Discovery

### What are Traits?

Traits are **searchable tags** stored as keccak256 hashes:

```typescript
traits: ["gaming", "social", "api:mcp", "pay:x402"]
  ↓ (hashed on-chain)
traitHashes: [
  0xabc123..., // keccak256("gaming")
  0xdef456..., // keccak256("social")
  ...
]
```

### Trait Categories

**API Types:**
- `api:openapi`, `api:graphql`, `api:jsonrpc`, `api:mcp`, `api:a2a`

**Payment:**
- `pay:x402` - Supports x402 micropayments

**Developer-Defined:**
- `gaming`, `social`, `defi`, `nft`, `metaverse`, `ai`, `enterprise`

You can define any trait you want.  OMA3 will add more suggested traits to the [OMATrust Specification](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification.md) in the future.

### Searching by Interface

**Use `getAppsByInterface()` for efficient filtering:**

```typescript
// Get all APIs
const result = await readContract({
  contract: registry,
  method: 'function getAppsByInterface(uint16, uint256) view returns (...)',
  params: [2, 0] // interfaceMask=2 (API), startIndex=0
});

const apiApps = result[0]; // Array of apps with API interface

// Get Human OR API apps
const result2 = await registry.getAppsByInterface(3, 0); // 3 = 1|2 (Human OR API)
```

**Interface masks:**
- `1` - Human only
- `2` - API only
- `3` - Human OR API
- `4` - Contract only
- `5` - Human OR Contract
- `6` - API OR Contract
- `7` - Any combination (all)

### Searching by Traits

**Current:** Requires fetching and checking each app

```typescript
// Get apps of specific type first (efficient)
const apiApps = await registry.getAppsByInterface(2, 0);

// Then filter by trait client-side
const mcpServers = [];
for (const app of apiApps[0]) {
  const traitHash = ethers.id("api:mcp");
  const hasTrait = await registry.hasAnyTraits(app.did, app.versionMajor, [traitHash]);
  if (hasTrait) {
    mcpServers.push(app);
  }
}
```

**Future:** Indexer will enable efficient multi-field search

```typescript
// With indexer (Shinzo, coming soon)
const mcpServers = await indexer.query({
  traits: ["api:mcp"],
  interfaces: 2,
  status: 0
});
```

## Artifact Verification (Binary Downloads)

### What are Artifacts?

For downloadable binaries, artifacts provide supply-chain security similar to Apple notarization or Windows Authenticode.

### Structure

**In platforms:**
```json
{
  "platforms": {
    "macos": {
      "downloadUrl": "https://example.com/app.dmg",
      "artifactDid": "did:artifact:bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"
    }
  }
}
```

**In artifacts map:**
```json
{
  "artifacts": {
    "did:artifact:bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi": {
      "type": "binary",
      "os": "macos",
      "architecture": "arm64",
    }
  }
}
```

### Artifact DID Format

`did:artifact:<cidv1>` - CIDv1 base32 hash of artifact bytes

**Why CIDv1?**
- Content-addressed (hash = identifier)
- IPFS compatible
- Self-verifying

### Verification Flow

```typescript
// 1. Client fetches download URL
const binary = await fetch(platforms.macos.downloadUrl);

// 2. Compute hash
const hash = sha256(binary);

// 3. Extract expected hash from artifact DID
const artifactDid = platforms.macos.artifactDid;
const expectedHash = extractHashFromDid(artifactDid);

// 4. Verify
if (hash === expectedHash) {
  // ✅ Binary hasn't been tampered with
  // Safe to install!
}
```

## Status Lifecycle

### Status Values

- **0 - Active** - Current, supported version
- **1 - Deprecated** - Still works but outdated
- **2 - Replaced** - Superseded by newer version

### Status Management

**Only the minter can update status:**

```typescript
await registry.updateStatus("did:web:example.com", 1, 1); // Set to deprecated
```

**Use cases:**
- Mark old versions as deprecated
- Sunset discontinued services
- Signal migrations to new versions

### Discovery Impact

**Public queries** (landing page, search):
- Only show **Active** apps by default
- Filter: `getAppsByStatus(0)` 

**Owner queries** (dashboard):
- Show all statuses
- Owner can manage deprecated apps

## Next Steps

- **[Registration Guide](./registration-guide.md)** - Register your first service
- **[Cookbooks](./cookbooks/register-website.md)** - Specific examples
- **[Attestations](./attestations.md)** - Build trust through verification
- **[Client Integration](./client-guide.md)** - Query the registry

---

**Ready to tokenize your service?** Head to [registry.omatrust.org](https://registry.omatrust.org) to get started.

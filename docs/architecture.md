---
id: architecture
title: Technical Architecture
sidebar_position: 2
---

# OMATrust Technical Architecture

:::caution Draft Documentation
This documentation is in **draft format** and under active development. Technical details may change as the protocol evolves. For the latest updates, see the [GitHub repository](https://github.com/oma3dao) or join the [OMA3 Discord](https://discord.gg/oma3).
:::

This document explains how OMATrust works under the hood: the smart contracts, data structures, and verification mechanisms that power the decentralized trust layer.

## System Components

### 1. App Registry Contract

**Contract:** `OMA3AppRegistry.sol`  
**Purpose:** Tokenize services as ERC-721 NFTs with metadata extensions

**Core Functions:**
```solidity
function mint(
    string did,
    uint16 interfaces,
    string dataUrl,
    bytes32 dataHash,
    uint8 dataHashAlgorithm,
    string fungibleTokenId,
    string contractId,
    uint8 major, uint8 minor, uint8 patch,
    bytes32[] traitHashes,
    string metadataJson
) external returns (uint256 tokenId)
```

**Key Features:**
- **DID-based indexing** - Apps indexed by DID + major version
- **Interface bitmap** - Supports Human (1), API (2), Contract (4) combinations
- **Version tracking** - Major.minor.patch with on-chain history
- **Status management** - Active, Deprecated, Replaced
- **Trait-based search** - Hash-based tagging for discoverability

### 2. Metadata Contract

**Contract:** `OMA3AppMetadata.sol`  
**Purpose:** Store optional on-chain metadata JSON

**Storage Model:**
- Metadata stored by **DID only** (not versioned)
- Version history tracked via blockchain events
- Gas-efficient: Only store when needed

**Why Separate?**
- Registry = Core identity (always on-chain)
- Metadata = Optional enrichment (can be off-chain via dataUrl)

### 3. Resolver Contract

**Contract:** `OMA3ResolverWithStore.sol`  
**Purpose:** Verify DID ownership and dataHash attestations

**Verification Types:**
```solidity
// DID ownership verification
function checkDID(bytes32 didHash, address controller) view returns (bool)

// DataHash attestation (from oracle/auditor)
function checkDataHashAttestation(bytes32 didHash, bytes32 dataHash) view returns (bool)
```

**Attestation Flow:**
1. Service registers with DID + dataHash
2. Oracle verifies ownership (domain verification, wallet signature)
3. Oracle writes attestation to resolver
4. Clients query resolver for proof

## Data Model

### App NFT Structure

```typescript
interface App {
  did: string;                    // Decentralized Identifier
  versionMajor: uint8;            // Major version (indexed)
  versionHistory: Version[];      // Full version history
  
  // Interface support
  interfaces: uint16;             // Bitmap: 1=Human, 2=API, 4=Contract
  
  // Metadata location
  dataUrl: string;                // URL to off-chain metadata JSON
  dataHash: bytes32;              // Hash of data at dataUrl
  dataHashAlgorithm: uint8;       // 0=keccak256, 1=sha256
  
  // On-chain identifiers
  contractId: string;             // CAIP-10 contract address
  fungibleTokenId: string;        // CAIP-19 token ID
  
  // Ownership & status
  minter: address;                // Original creator
  status: uint8;                  // 0=Active, 1=Deprecated, 2=Replaced
  
  // Discoverability
  traitHashes: bytes32[];         // Searchable tags
}
```

### Metadata JSON Structure

**Off-chain metadata** (at `dataUrl`):

```json
{
  "name": "My App",
  "description": "App description",
  "image": "https://example.com/icon.png",
  "publisher": "Publisher Name",
  
  // Interface-specific fields
  "platforms": {
    "web": {"launchUrl": "https://app.example.com"},
    "ios": {"downloadUrl": "https://...", "artifactDid": "did:artifact:..."}
  },
  "endpoint": {
    "url": "https://api.example.com",
    "schemaUrl": "https://api.example.com/openapi.json"
  },
  "mcp": {
    "tools": [...],
    "resources": [...],
    "prompts": [...]
  },
  
  // Traits for discovery
  "traits": ["api:rest", "pay:x402", "gaming"]
}
```

## Storage Strategy: DID-Only with Version Events

**Challenge:** Storing full metadata for every version is expensive.

**Solution:** Store by DID only, track versions via events.

### On-Chain Storage
```
Registry: stores App struct at tokenID
  ├─ DID: did:web:example.com
  ├─ Major Version: 2
  └─ versionHistory: [1.0.0, 1.5.2, 2.0.0]

Metadata Contract: stores JSON by DID
  └─ did:web:example.com → {latest metadata JSON}
```

### Version Tracking
```
Blockchain events provide history:
  Event: MetadataSet(did, 1.0.0, hash, timestamp)
  Event: MetadataSet(did, 1.5.2, hash, timestamp)
  Event: MetadataSet(did, 2.0.0, hash, timestamp)
```

**Benefits:**
- ✅ Gas efficient (one storage slot per DID)
- ✅ Version history preserved in events
- ✅ Can reconstruct any version from events + dataUrl

## Verification Architecture

### DID Verification Flow

**For did:web:**
```
1. User registers: did:web:example.com
2. Frontend calls: POST /api/verify-did
3. Server fetches: https://example.com/.well-known/did.json
4. Validates: wallet address in DID document
5. Issues attestation to resolver
6. User can now mint app NFT
```

**For did:pkh:**
```
1. User registers: did:pkh:eip155:1:0xContractAddress
2. Frontend calls: POST /api/verify-did
3. Server checks: contract owner matches connected wallet
4. Issues attestation
5. User can mint
```

### DataHash Verification

**Integrity check:**
```typescript
// 1. Fetch metadata from dataUrl
const response = await fetch(app.dataUrl);
const jsonText = await response.text();

// 2. Compute hash
const computedHash = ethers.id(jsonText); // keccak256

// 3. Compare with stored hash
if (computedHash === app.dataHash) {
  // ✅ Data hasn't been tampered with
}

// 4. Check for attestation
const attested = await resolver.checkDataHashAttestation(didHash, dataHash);
if (attested) {
  // ✅ Oracle verified this hash
}
```

## Interface Types Explained

OMATrust supports three interface types (can be combined):

### Human Interface (Bit 1)

**For:** Websites, apps with GUI, downloadable binaries

**Required Fields:**
- Screenshots
- App icon
- Platform availability (web, iOS, Android, etc.)

**Optional:**
- Video URLs
- 3D assets (for AR/VR)
- IWPS portal URL (metaverse integration)

### API Interface (Bit 2)

**For:** REST APIs, GraphQL, JSON-RPC, MCP servers, A2A agents

**Required Fields:**
- Endpoint URL
- API type (via traits: `api:rest`, `api:mcp`, etc.)

**Optional:**
- Schema URL (OpenAPI spec, GraphQL SDL, etc.)
- Interface versions
- MCP configuration (for AI agents)

### Smart Contract Interface (Bit 4)

**For:** On-chain applications

**Required Fields:**
- Contract address (via DID: `did:pkh:eip155:1:0xAddress`)

**Optional:**
- Recommended RPC endpoint
- ABI schema URL

**Examples:**
```
Human only: interfaces = 1
API only: interfaces = 2
Contract only: interfaces = 4
Human + API: interfaces = 3
All interfaces: interfaces = 7
```

## Deployment

### Testnet (Current)

**Network:** OMAchain Testnet  
**Chain ID:** 66238  
**RPC:** https://rpc.testnet.chain.oma3.org/  
**Explorer:** https://explorer.testnet.chain.oma3.org/  
**Faucet:** https://faucet.testnet.chain.oma3.org/

**Contracts:**
```
Registry:  0xb493465Bcb2151d5b5BaD19d87f9484c8B8A8e83
Metadata:  0x13aD113D0DE923Ac117c82401e9E1208F09D7F19
Resolver:  0x7946127D2f517c8584FdBF801b82F54436EC6FC7
```

### Mainnet (Planned)

**Network:** OMAchain Mainnet  
**Chain ID:** 999999 (TBD)  
**Status:** Coming soon

## Security Model

### Ownership & Permissions

- **Minter** - Original creator, can update metadata
- **Owner** - Current NFT holder (transferable)
- **Resolver Issuers** - Authorized oracles for attestations

### Trust Assumptions

**What's verified on-chain:**
- ✅ DID ownership (via resolver attestation)
- ✅ DataHash integrity (hash comparison)
- ✅ Attestation signatures (EAS standard)

**What's NOT verified:**
- ❌ Off-chain metadata content (you must trust dataUrl host)
- ❌ Attestation quality (trust the issuer's reputation)

### Mitigation Strategies

1. **DataHash verification** - Detect tampering
2. **Issuer reputation** - Track oracle reliability
3. **Multiple attestations** - Require consensus
4. **Time-based maturation** - Delay before trust is granted

## Integration Points

### Frontend

**Registry UI:** https://registry.omatrust.org  
**Reputation UI:** https://reputation.oma3.org

### API Endpoints

**Verify DID ownership:**
```
POST /api/verify-did
Body: { did, connectedAddress }
Returns: { verified, txHash }
```

**Fetch metadata:**
```
GET /api/data-url/{versionedDid}
Returns: JSON metadata
```

**Verify and attest:**
```
POST /api/verify-and-attest
Body: { did, connectedAddress }
Returns: { verified, attested, txHash }
```

### Smart Contract Integration

**Read from registry:**
```solidity
import "./OMA3AppRegistry.sol";

OMA3AppRegistry registry = OMA3AppRegistry(registryAddress);
App memory app = registry.getApp("did:web:example.com", 1);

// Verify dataHash
bytes32 computedHash = keccak256(bytes(fetchedJson));
require(computedHash == app.dataHash, "Data tampered");
```

**Query attestations:**
```solidity
import "./OMA3ResolverWithStore.sol";

OMA3ResolverWithStore resolver = OMA3ResolverWithStore(resolverAddress);
bytes32 didHash = keccak256(bytes(did));
bool verified = resolver.checkDataHashAttestation(didHash, dataHash);
```

## Gas Optimization

### Efficient Storage

- **DID-only metadata** - Not versioned, saves gas
- **Event-based history** - Versions tracked in logs
- **Hash verification** - Cheap comparison vs full storage

### Batch Operations

Registry contract supports single-transaction minting:
```solidity
// One tx mints registry NFT AND stores metadata
registry.mint(...12 parameters including metadataJson)
```

## Roadmap

**Current (Testnet):**
- ✅ Registry, Metadata, Resolver contracts
- ✅ DID verification (did:web, did:pkh)
- ✅ Multi-interface support (Human, API, Contract)
- ✅ DataHash attestations

**Coming Soon:**
- EAS integration for structured attestations
- Cross-chain deployment (Ethereum, Base, Optimism)
- Deduplication contracts on OMAchain
- Enhanced reputation scoring
- User review attestations

## Learn More

- **[Tokenized Services](./tokenized-app.md)** - Data model details
- **[Attestation Framework](./attestations.md)** - How trust is verified
- **[Registration Cookbooks](./cookbooks/register-website.md)** - Specific examples
- **[Client Guide](./client-guide.md)** - Integration for apps

---

**Questions?** Join the OMA3 Discord or open an issue on GitHub.


---
id: architecture
title: Technical Architecture
sidebar_position: 2
---

# OMATrust Technical Architecture

:::caution Draft Documentation
This documentation is in **draft format** and under active development. Technical details may change as the protocol evolves. For the latest updates, see the [GitHub repository](https://github.com/oma3dao).
:::

This document explains how OMATrust works under the hood: the smart contracts, data structures, and verification mechanisms that power the decentralized trust layer.

## System Components

### 1. Identity Registry Contract

**Contract:** `OMA3AppRegistry.sol`  
**Purpose:** Tokenize services as ERC-721 NFTs with metadata extensions  
**Standard:** Compatible with ERC-8009 (Tokenized Services)

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
- **Trait-based tagging** - Hash-based tags for indexer discoverability

**Query Functions:**
- `getAppsByStatus()` - Filter by status (Active, Deprecated, Replaced)
- `getAppsByOwner()` - Get user's apps
- `getAppsByInterface()` - Filter by interface type(s) - **On-chain search**
- `hasAnyTraits()`, `hasAllTraits()` - Check individual app traits

**Note:** Trait search requires client-side filtering or indexer (Shinzo). Interface search is on-chain due to finite values (1-7) vs unlimited trait possibilities.

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

### 4. EAS Framework

**Contracts:** `EAS.sol`, `SchemaRegistry.sol`  
**Purpose:** Structured attestations for reputation, certifications, and security assessments

**Integration:**
OMATrust uses the Ethereum Attestation Service (EAS) for structured attestations beyond basic DID ownership verification. EAS provides a standardized framework for creating, querying, and managing on-chain attestations with custom schemas.

**Core Components:**
- **Schema Registry** - Register custom attestation schemas
- **EAS Contract** - Issue and manage attestations following registered schemas

**Supported Attestation Types:**
- **Certification** - Compliance and certification attestations
- **Endorsement** - Trust and approval attestations
- **Security Assessment** - Security audit and vulnerability assessment attestations
- **User Review** - Community feedback and ratings (1-5 stars) with optional cryptographic proofs
- **User Review Response** - Responses from app owners to user reviews

**Key Features:**
- Schema-based attestations with structured data
- Cryptographic proofs - Attestations can include cryptographic proofs that validate specific claims (e.g., proof of service usage for user reviews)
- Revocable attestations (when configured)
- Cross-chain attestation support
- Standardized query interface for clients

**Deployment:**
```
EAS:       0x8835AF90f1537777F52E482C8630cE4e947eCa32
Schema Registry: 0x7946127D2f517c8584FdBF801b82F54436EC6FC7
```

## Data Model

### App NFT Structure

```typescript
interface App {
  did: string;                    // Decentralized Identifier
  versionMajor: uint8;            // Major version (indexed)
  versionHistory: Version[];      // Full version history
  
  // Interface support
  interfaces: uint16;             // Bitmap: bit 0=Human (value 1), bit 1=API (value 2), bit 2=Contract (value 4)
  
  // Metadata location
  dataUrl: string;                // URL to off-chain metadata JSON
  dataHash: bytes32;              // Hash of data at dataUrl
  dataHashAlgorithm: string;      // "keccak256" or "sha256"
  
  // On-chain identifiers
  contractId: string;             // CAIP-10 contract address
  fungibleTokenId: string;        // CAIP-19 token ID
  
  // Ownership & status
  minter: address;                // Original creator
  status: uint8;                  // 0=Active, 1=Deprecated, 2=Replaced
  
  // Discoverability
  traitHashes: bytes32[];         // Searchable tags (≤20 entries)
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
  "endpoints": [
    {
      "name": "REST API",
      "endpoint": "https://api.example.com",
      "schemaUrl": "https://api.example.com/openapi.json"
    },
    {
      "name": "MCP",
      "endpoint": "https://mcp.example.com",
      "tools": [...],
      "resources": [...],
      "prompts": [...]
    }
  ],
  
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
2. Frontend calls: POST /api/verify-and-attest
3. Server checks for existing attestations (fast path)
4. If missing: fetches https://example.com/.well-known/did.json
5. Validates: wallet address in DID document
6. Issues attestation to resolver
7. User can now mint app NFT
```

**For did:pkh:**
```
1. User registers: did:pkh:eip155:1:0xContractAddress
2. Frontend calls: POST /api/verify-and-attest
3. Server checks for existing attestations (fast path)
4. If missing: checks contract owner matches connected wallet
5. Issuer issues attestation
6. User can mint
```

### DataHash Verification

**Integrity check:**
```typescript
// 1. Fetch metadata from dataUrl
const response = await fetch(app.dataUrl);
const jsonText = await response.text();

// 2. Canonicalize JSON using JCS (RFC 8785)
// Note: Use a JCS library for proper canonicalization
// See Identity Specification for details
const canonicalJson = canonicalizeJson(jsonText);

// 3. Compute hash
const computedHash = app.dataHashAlgorithm === 'keccak256' 
  ? ethers.id(canonicalJson)
  : sha256(canonicalJson);

// 4. Compare with stored hash
if (computedHash === app.dataHash) {
  // ✅ Data hasn't been tampered with
}

// 5. Check for attestation
const attested = await resolver.checkDataHashAttestation(didHash, dataHash);
if (attested) {
  // ✅ Issuer verified this hash
}
```

**Important:** JSON must be canonicalized using JCS (JSON Canonicalization Scheme, RFC 8785) before hashing to ensure consistent hash values. See the [Identity Specification](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-identity.md) for complete details.

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
Registry:  0x63A7C12f54B4f42Cae7234f7e20c7A08f725B9F9
Metadata:  0xFdd87eA429D963eCB671D409128dC94BFf5f0694
Resolver:  0x77E058106762AeA4A567f2919Ef896bb6A82f914
EAS:       0x8835AF90f1537777F52E482C8630cE4e947eCa32
Schema Registry: 0x7946127D2f517c8584FdBF801b82F54436EC6FC7
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
- ✅ DataHash integrity (hash comparison with JCS canonicalization)
- ✅ Attestation signatures (EAS standard)
- ✅ Attestation quality (cryptographic proofs validate claims)

**What's NOT verified:**
- ❌ Off-chain metadata content (you must trust dataUrl host)

### Mitigation Strategies

1. **DataHash verification** - Detect tampering using JCS-canonicalized hashes
2. **Issuer reputation** - Track issuer/attester reliability
3. **Multiple attestations** - Require consensus from multiple issuers
4. **Cryptographic proofs** - Attestations can include proofs that validate specific claims (see [Proof Specification](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-proofs.md))
5. **Challenge mechanism** - Resolver supports challenges to disputed attestations (see [Identity Specification](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-identity.md) for details)
6. **Maturation delay** - Time-based delay before trust is granted

**DID → Index Address Mapping:** The system maps DIDs to Ethereum addresses for on-chain indexing. This mapping is handled by the SDK and contracts. See the [Identity Specification](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-identity.md) for technical details.

## Integration Points

### Frontend

**Registry UI:** https://registry.omatrust.org  
**Reputation UI:** https://reputation.oma3.org

### API Endpoints

**Verify and attest (unified endpoint):**
```
POST /api/verify-and-attest
Body: { did, connectedAddress, requiredSchemas }
Returns: { ok, status, attestations, txHashes }
```

**Fetch metadata:**
```
GET /api/data-url/{versionedDid}
Returns: JSON metadata
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

**Questions?** Open an issue on GitHub.


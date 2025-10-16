---
id: infrastructure
title: Infrastructure & Deployment
sidebar_position: 10
---

# Infrastructure & Deployment

:::caution Draft Documentation
Infrastructure details are subject to change. Contract addresses are for testnet only. Mainnet deployment plans may evolve. Check [GitHub](https://github.com/oma3dao) for latest contract addresses.
:::

Technical details about OMATrust's infrastructure, smart contracts, and deployment architecture.

## Smart Contract Architecture

### Core Contracts

#### OMA3AppRegistry.sol

**Purpose:** Main registry for tokenizing services

**Key Functions:**
```solidity
// Mint new service
function mint(
    string did,
    uint16 interfaces,
    string dataUrl,
    bytes32 dataHash,
    uint8 dataHashAlgorithm,
    string fungibleTokenId,
    string contractId,
    uint8 initialVersionMajor,
    uint8 initialVersionMinor,
    uint8 initialVersionPatch,
    bytes32[] traitHashes,
    string metadataJson
) external returns (uint256 tokenId)

// Update app (now handles metadata atomically)
function updateAppControlled(
    string did,
    uint8 major,
    string newDataUrl,
    bytes32 newDataHash,
    uint8 newDataHashAlgorithm,
    uint16 newInterfaces,
    bytes32[] newTraitHashes,
    uint8 newMinor,
    uint8 newPatch,
    string metadataJson  // Optional: pass empty string if no metadata update
) external

// Update status
function updateStatus(string did, uint8 major, uint8 newStatus) external

// Query
function getApp(string did, uint8 major) view returns (App)
function getAppsByStatus(uint8 status, uint256 startIndex) view returns (App[], uint256)
function getAppsByOwner(address owner, uint256 startIndex) view returns (App[], uint256)
```

**Storage Model:**
```solidity
struct App {
    string did;
    uint8 versionMajor;
    Version[] versionHistory;
    uint16 interfaces;
    string dataUrl;
    bytes32 dataHash;
    uint8 dataHashAlgorithm;
    string contractId;
    string fungibleTokenId;
    address minter;
    uint8 status;
    bytes32[] traitHashes;
}

struct Version {
    uint8 major;
    uint8 minor;
    uint8 patch;
}

// Mappings
mapping(uint256 => App) private _apps;
mapping(bytes32 => mapping(uint8 => uint256)) private _didMajorToToken;
```

#### OMA3AppMetadata.sol

**Purpose:** Optional on-chain metadata storage

**Key Functions:**
```solidity
// Store metadata
function setMetadataForRegistry(
    string did,
    uint8 major,
    uint8 minor,
    uint8 patch,
    string metadataJson
) external onlyRegistry

// Retrieve metadata
function getMetadataJson(string did) view returns (string)

// Feature flags
function setRequireDataUrlAttestation(bool required) external onlyOwner
function checkDataHashAttestation(string did) view returns (bool)
```

**Storage:**
```solidity
mapping(string => string) private _metadata; // DID → JSON
mapping(string => VersionInfo[]) private _versionHistory; // DID → versions
```

**Why separate contract?**
- Optional: Services can skip on-chain metadata storage
- Gas efficient: Only pay if you want permanent storage
- Modular: Can deploy different metadata strategies

#### OMA3ResolverWithStore.sol

**Purpose:** Attestation storage and verification

**Key Functions:**
```solidity
// Issue attestation (issuers only)
function upsertDirect(
    bytes32 didHash,
    bytes32 controllerAddress,
    uint64 expiresAt
) external onlyIssuer

// Query attestations
function checkDID(bytes32 didHash, address controller) view returns (bool)
function checkDataHashAttestation(bytes32 didHash, bytes32 dataHash) view returns (bool)

// Issuer management
function addIssuer(address issuer) external onlyOwner
function removeIssuer(address issuer) external onlyOwner

// Configuration
function setMaturationTime(uint256 time) external onlyOwner
function setMaxTTL(uint256 ttl) external onlyOwner
```

**Storage:**
```solidity
struct Entry {
    bytes32 controllerAddress;
    uint64 issuedAt;
    uint64 expiresAt;
}

mapping(bytes32 => Entry[]) private _entries; // didHash → attestations
mapping(address => bool) private _issuers; // Authorized issuers
```

### Contract Interactions

```
┌─────────────────┐
│   User/Client   │
│                 │
└────────┬────────┘
         │
         ├─── mint() ──────────────────┐
         │                             │
         │                             ▼
    ┌────▼─────────────┐      ┌───────────────┐
    │  AppRegistry     │◄─────│  AppMetadata  │
    │  (ERC-721)       │      │  (Storage)    │
    └────┬─────────────┘      └───────────────┘
         │                             ▲
         │                             │
         └─ updateAppControlled() ─────┘
            (with metadata param)
         
         
┌──────────────────┐
│   Oracle/Issuer  │
└────────┬─────────┘
         │
         ├─── upsertDirect() ──────┐
         │                         │
         │                         ▼
         │                  ┌──────────────┐
         └──────────────────│   Resolver   │
                            │ (Attestations)│
                            └──────────────┘
```

## Deployment Architecture

### Networks

#### OMAchain Testnet (Current)

```yaml
Network: OMAchain Testnet
Chain ID: 66238
RPC: https://rpc.testnet.chain.oma3.org/
Explorer: https://explorer.testnet.chain.oma3.org/
Faucet: https://faucet.testnet.chain.oma3.org/

Contracts:
  Registry: 0xb493465Bcb2151d5b5BaD19d87f9484c8B8A8e83
  Metadata: 0x13aD113D0DE923Ac117c82401e9E1208F09D7F19
  Resolver: 0x7946127D2f517c8584FdBF801b82F54436EC6FC7

Status: Live (testnet)
```

#### OMAchain Mainnet (Planned)

```yaml
Network: OMAchain Mainnet
Chain ID: 999999 (TBD)
RPC: https://rpc.chain.oma3.org/
Explorer: https://explorer.chain.oma3.org/

Status: Coming Q2 2025
```

### Frontend Applications

#### Registry UI

```yaml
URL: https://registry.omatrust.org
Repository: github.com/oma3dao/app-registry-frontend
Framework: Next.js 14
Hosting: Vercel

Features:
  - Service registration wizard
  - Dashboard for service management
  - DID verification
  - Metadata editing
  - Trust verification display
```

#### Reputation UI

```yaml
URL: https://reputation.oma3.org
Repository: github.com/oma3dao/rep-attestation-frontend
Framework: Next.js 14
Hosting: Vercel

Features:
  - View attestations
  - Request attestations
  - Submit user reviews
  - Trust score calculation
```

### Backend Services

#### Verification API

**Endpoints:**
```yaml
POST /api/verify-and-attest
  Purpose: Unified verification and attestation (idempotent)
  Input: { did, connectedAddress, requiredSchemas }
  Output: { ok, status, attestations, txHashes }
  Flow: Check existing → Verify if needed → Write attestations → Return status

GET /api/data-url/{versionedDid}
  Purpose: Fetch metadata
  Input: Path parameter
  Output: JSON metadata
```

**Environment Variables:**
```bash
# Required
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=...
NEXT_PUBLIC_ACTIVE_CHAIN=omachain-testnet

# For verification oracle (server-side)
ISSUER_PRIVATE_KEY=0x...

# OR use Thirdweb Managed Vault (production)
THIRDWEB_SECRET_KEY=...
THIRDWEB_SERVER_WALLET_ADDRESS=0x...
```

## Database & Indexing

### Current (On-Chain Only)

**No centralized database** - all data on-chain:
- Service data: In registry contract
- Metadata: At dataUrl or in metadata contract
- Attestations: In resolver contract

**Querying:**
- Direct contract calls (slower, decentralized)
- RPC endpoints (Thirdweb, Alchemy, etc.)

### Future: Indexer

**Planned GraphQL indexer:**
```yaml
Technology: The Graph Protocol
Endpoints: Subgraph for each chain

Indexed Data:
  - All service registrations
  - Metadata changes (via events)
  - Attestations issued/revoked
  - Version history
  - Trait mappings

Benefits:
  - Fast search
  - Complex queries
  - Aggregations
  - Real-time updates
```

**Example query:**
```graphql
{
  services(
    where: { traits_contains: "api:mcp", status: 0 }
    orderBy: trustScore
    orderDirection: desc
  ) {
    did
    name
    trustScore
    attestations {
      type
      issuer
      timestamp
    }
  }
}
```

## Infrastructure Components

### RPC Providers

**Testnet:**
- Primary: OMAchain testnet RPC
- Backup: Thirdweb RPC Edge (with client ID)

**Mainnet (future):**
- Primary: OMAchain mainnet RPC
- Fallbacks: Alchemy, Infura, Public RPCs

### Storage

**On-Chain:**
- Service identity (registry)
- Attestations (resolver)
- Optional metadata (metadata contract)

**Off-Chain:**
- Metadata JSON (at dataUrl)
- Images, screenshots (CDN - Cloudinary recommended)
- Audit reports (IPFS or HTTP)

**Recommended CDN:** Cloudinary
- Free tier: 25GB storage, 25GB bandwidth
- Image optimization
- Responsive images
- See [Cloudinary Guide](./cloudinary-guide.md)

### Hosting Providers

**Frontend:**
- Vercel (recommended) - auto-deploy from GitHub
- Netlify - alternative
- AWS Amplify - enterprise

**Metadata endpoints:**
- Vercel serverless functions
- AWS Lambda
- IPFS (decentralized)
- Your own servers

## Monitoring & Observability

### Smart Contract Events

**Monitor for updates:**
```typescript
// Listen for new registrations
registry.on('AppMinted', (didHash, major, tokenId, minter) => {
  console.log(`New service registered: ${tokenId}`);
  // Invalidate caches, update indexes, etc.
});

// Listen for metadata updates
registry.on('MetadataUpdated', (didHash, major, minor, patch) => {
  console.log(`Metadata updated for ${didHash}`);
  // Refresh cached data
});

// Listen for attestations
resolver.on('EntryAdded', (didHash, controller, issuedAt, expiresAt) => {
  console.log(`New attestation issued for ${didHash}`);
  // Update trust scores
});
```

### Health Checks

**Monitor infrastructure:**
```typescript
async function checkInfrastructureHealth() {
  const checks = [
    { name: 'Registry Contract', check: () => registry.totalSupply() },
    { name: 'Metadata Contract', check: () => metadata.getMetadataJson('did:web:test.com') },
    { name: 'Resolver Contract', check: () => resolver.checkDID(testDidHash, testAddress) },
    { name: 'RPC Endpoint', check: () => provider.getBlockNumber() },
    { name: 'Frontend', check: () => fetch('https://registry.omatrust.org').then(r => r.ok) },
  ];
  
  const results = await Promise.all(
    checks.map(async ({ name, check }) => {
      try {
        await check();
        return { name, status: 'OK' };
      } catch (error) {
        return { name, status: 'FAIL', error: error.message };
      }
    })
  );
  
  return results;
}

// Run every 5 minutes
setInterval(async () => {
  const health = await checkInfrastructureHealth();
  const allHealthy = health.every(check => check.status === 'OK');
  
  if (!allHealthy) {
    alert('Infrastructure issue detected!');
    console.error(health.filter(c => c.status === 'FAIL'));
  }
}, 300000);
```

## Gas Optimization

### Efficient Querying

**Use pagination:**
```typescript
// Don't fetch all at once
const all = await registry.totalSupply(); // 10,000 services

// DO fetch in batches
let services = [];
let startIndex = 0;

while (true) {
  const result = await registry.getAppsByStatus(0, startIndex);
  services.push(...result.apps);
  
  if (result.nextStartIndex === 0) break;
  startIndex = result.nextStartIndex;
}
```

**Batch multicalls:**
```typescript
import { multicall } from 'thirdweb';

const calls = dids.map(did => ({
  contract: registry,
  method: 'function getApp(string, uint8) view returns (...)',
  params: [did, 1]
}));

const results = await multicall({ calls }); // One RPC call instead of N
```

### Efficient Storage

**Registry design choices:**
- ✅ DID-only metadata (not versioned)
- ✅ Event-based version history
- ✅ Hash instead of full content
- ✅ Bitmap interfaces (uint16 vs multiple bools)
- ✅ Indexed lookups (_didMajorToToken)

**Gas costs (approximate):**
```
Mint:           ~500k gas
Update status:  ~50k gas
Set metadata:   ~200k gas (if on-chain)
Issue attestation: ~75k gas
```

## Security Architecture

### Access Control

**Registry:**
```solidity
modifier onlyAppOwner(string memory did, uint8 major) {
    uint256 tokenId = _resolveToken(did, major);
    require(ownerOf(tokenId) == msg.sender, "Not app owner");
    _;
}
```

**Metadata:**
```solidity
modifier onlyRegistry() {
    require(msg.sender == registryAddress, "Only registry");
    _;
}
```

**Resolver:**
```solidity
modifier onlyIssuer() {
    require(_issuers[msg.sender], "Not authorized issuer");
    _;
}
```

### Reentrancy Protection

All state-changing functions use `nonReentrant`:
```solidity
function mint(...) external nonReentrant returns (uint256) {
    // Safe from reentrancy attacks
}
```

### Input Validation

```solidity
// DID validation
require(bytes(didString).length > 0, "DID required");
require(bytes(didString).length <= 200, "DID too long");

// Interface validation
require(interfaces > 0 && interfaces <= 7, "Invalid interfaces");

// Version validation
require(major > 0, "Major version must be > 0");
```

## Deployment Process

### Testnet Deployment

**Using Hardhat:**
```bash
# 1. Deploy all contracts
npx hardhat deploy-system --network omachainTestnet

# Output:
# Registry:  0xb493465Bcb2151d5b5BaD19d87f9484c8B8A8e83
# Metadata:  0x13aD113D0DE923Ac117c82401e9E1208F09D7F19
# Resolver:  0x7946127D2f517c8584FdBF801b82F54436EC6FC7

# 2. Configure connections
npx hardhat registry-set-metadata-contract \
  --metadata 0x13aD113D0DE923Ac117c82401e9E1208F09D7F19 \
  --network omachainTestnet

npx hardhat registry-set-dataurl-resolver \
  --resolver 0x7946127D2f517c8584FdBF801b82F54436EC6FC7 \
  --network omachainTestnet

npx hardhat metadata-authorize-registry \
  --registry 0xb493465Bcb2151d5b5BaD19d87f9484c8B8A8e83 \
  --network omachainTestnet

# 3. Add oracle as issuer
npx hardhat resolver-add-issuer \
  --issuer 0xOracleAddress \
  --network omachainTestnet
```

### Mainnet Deployment (Future)

**Production checklist:**
- [ ] Security audit completed
- [ ] Test coverage > 95%
- [ ] Testnet running smoothly for 3+ months
- [ ] Governance approval
- [ ] Multi-sig for admin functions
- [ ] Timelock for sensitive operations
- [ ] Bug bounty program active

## API Infrastructure

### Frontend Deployment (Vercel)

**Environment variables:**
```bash
# Public (client-side)
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=...
NEXT_PUBLIC_ACTIVE_CHAIN=omachain-testnet
NEXT_PUBLIC_REGISTRY_ADDRESS=0xb493465Bcb2151d5b5BaD19d87f9484c8B8A8e83
NEXT_PUBLIC_METADATA_ADDRESS=0x13aD113D0DE923Ac117c82401e9E1208F09D7F19
NEXT_PUBLIC_RESOLVER_ADDRESS=0x7946127D2f517c8584FdBF801b82F54436EC6FC7

# Private (server-side, for oracle)
ISSUER_PRIVATE_KEY=0x... (testnet only)
# Or for production:
THIRDWEB_SECRET_KEY=...
THIRDWEB_SERVER_WALLET_ADDRESS=0x...
```

**Deploy:**
```bash
cd app-registry-frontend
vercel --prod
```

### API Routes

**Serverless functions:**
```
/api/verify-and-attest - Unified verification + attestation (idempotent)
/api/data-url/[...versionedDid] - Metadata proxy
/api/validate-url - URL validation helper
```

**Rate limiting (recommended):**
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'Too many requests, please try again later'
});

app.use('/api/', limiter);
```

## Scaling Considerations

### Current Capacity

**Testnet limits:**
- Registry: ~10-100 services (testing phase)
- RPC: Standard testnet limits
- Frontend: Vercel limits (generous for testnet)

### Mainnet Scaling

**Projected capacity:**
- Services: 100k-1M (blockchain scales)
- RPC: Multiple providers for redundancy
- Indexer: Subgraph handles millions of entries

**Bottlenecks:**
- RPC rate limits → Use multiple providers
- Metadata hosting → CDN + IPFS
- Search without indexer → Slow (need indexer)

## Disaster Recovery

### Contract Upgrades

**Current:** Immutable contracts (no upgrades)

**If critical bug found:**
1. Deploy new version
2. Migrate data (via events)
3. Update frontend to use new addresses
4. Notify community

**Future:** Proxy pattern for upgradeability
- Transparent proxy for registry
- 48-hour timelock for upgrades
- Multi-sig for upgrade authorization

### Data Recovery

**All data recoverable from:**
- Blockchain state (current)
- Blockchain events (history)
- IPFS archives (metadata backups)

**Recovery process:**
```typescript
// Reconstruct all services from events
async function recoverAllServices() {
  const mintEvents = await registry.queryFilter(
    registry.filters.AppMinted()
  );
  
  const services = mintEvents.map(event => ({
    did: event.args.did,
    major: event.args.major,
    tokenId: event.args.tokenId,
    minter: event.args.minter,
    blockNumber: event.blockNumber
  }));
  
  return services;
}
```

## Monitoring Stack

### Recommended Tools

**Blockchain monitoring:**
- Tenderly (contract monitoring, alerts)
- Defender (OpenZeppelin) - automated responses
- Dune Analytics - dashboards

**Application monitoring:**
- Vercel Analytics (frontend)
- Sentry (error tracking)
- LogRocket (session replay)

**Uptime monitoring:**
- UptimeRobot (simple, free tier)
- Pingdom (enterprise)
- Custom oracle (for attestations)

## Next Steps

- **[Architecture](./architecture.md)** - Technical deep dive
- **[Client Guide](./client-guide.md)** - Integration patterns
- **[FAQ](./faq.md)** - Common questions

---

**Questions about infrastructure?** Join the OMA3 Discord #dev channel.

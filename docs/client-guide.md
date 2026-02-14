---
id: client-guide  
title: Client Integration Guide
sidebar_position: 6
---

# Client Integration Guide

:::caution Draft Documentation
API interfaces and code examples are subject to change. Test thoroughly before production use.
:::

Learn how to query the OMATrust registry and verify services in your application, whether you're building a web app, mobile app, AI agent, or smart contract.

## Quick Start

### Installation

```bash
npm install thirdweb ethers
```

### Basic Setup

```typescript
import { createThirdwebClient, getContract, readContract } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { ethers } from 'ethers';

// Create client
const client = createThirdwebClient({ 
  clientId: process.env.THIRDWEB_CLIENT_ID 
});

// Define OMAchain Testnet
const omachainTestnet = defineChain({
  id: 66238,
  rpc: 'https://rpc.testnet.chain.oma3.org'
});

// Get contracts
const registry = getContract({
  client,
  chain: omachainTestnet,
  address: '0xb493465Bcb2151d5b5BaD19d87f9484c8B8A8e83'
});

const resolver = getContract({
  client,
  chain: omachainTestnet,
  address: '0x7946127D2f517c8584FdBF801b82F54436EC6FC7'
});
```

## Querying Services

### Get Service by DID

```typescript
async function getService(did: string, majorVersion: number) {
  const app = await readContract({
    contract: registry,
    method: 'function getApp(string, uint8) view returns (tuple(...))',
    params: [did, majorVersion]
  });
  
  return {
    did: app.did,
    version: `${app.versionHistory[app.versionHistory.length - 1].major}.${app.versionHistory[app.versionHistory.length - 1].minor}.${app.versionHistory[app.versionHistory.length - 1].patch}`,
    interfaces: Number(app.interfaces),
    dataUrl: app.dataUrl,
    dataHash: app.dataHash,
    status: Number(app.status),
    minter: app.minter
  };
}
```

### Get All Active Services

```typescript
async function listActiveServices(startIndex = 0, pageSize = 20) {
  const result = await readContract({
    contract: registry,
    method: 'function getAppsByStatus(uint8, uint256) view returns (tuple(...

)[], uint256)',
    params: [0, startIndex] // 0 = Active status
  });
  
  return {
    apps: result[0],
    nextStartIndex: Number(result[1])
  };
}
```

### Search by Traits

```typescript
async function searchByTraits(traits: string[], matchMode: 'any' | 'all' = 'any') {
  // Hash traits
  const traitHashes = traits.map(t => ethers.id(t)); // keccak256
  
  // Query registry (example - actual implementation depends on indexer)
  const apps = await registry.getAppsByTraits(traitHashes, matchMode);
  
  return apps;
}

// Examples
const gamingApps = await searchByTraits(['gaming']);
const paidMcpServers = await searchByTraits(['api:mcp', 'pay:x402'], 'all');
```

## Fetching Metadata

### From DataUrl

```typescript
async function fetchMetadata(dataUrl: string) {
  const response = await fetch(dataUrl);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch metadata: ${response.status}`);
  }
  
  return await response.json();
}

// Example
const app = await getService('did:web:example.com', 1);
const metadata = await fetchMetadata(app.dataUrl);

console.log(metadata.name); // "My Service"
console.log(metadata.endpoint.url); // "https://api.example.com"
```

### From On-Chain (if available)

```typescript
const metadataContract = getContract({
  client,
  chain: omachainTestnet,
  address: '0x13aD113D0DE923Ac117c82401e9E1208F09D7F19'
});

const metadataJson = await readContract({
  contract: metadataContract,
  method: 'function getMetadataJson(string) view returns (string)',
  params: [did]
});

const metadata = JSON.parse(metadataJson);
```

## Verification

### Verify Data Integrity

```typescript
async function verifyDataIntegrity(app: App) {
  // 1. Fetch metadata
  const response = await fetch(app.dataUrl);
  const jsonText = await response.text();
  
  // 2. Canonicalize JSON using JCS (RFC 8785)
  // Note: Use a JCS library for proper canonicalization
  const canonicalJson = canonicalizeJson(jsonText);
  
  // 3. Compute hash
  const computedHash = app.dataHashAlgorithm === 'keccak256' 
    ? ethers.id(canonicalJson)
    : sha256(canonicalJson);
  
  // 4. Compare
  if (computedHash.toLowerCase() === app.dataHash.toLowerCase()) {
    return { valid: true, message: 'Data integrity verified' };
  } else {
    return {
      valid: false,
      message: 'Hash mismatch - metadata may have been modified',
      expected: app.dataHash,
      computed: computedHash
    };
  }
}
```

**Important:** JSON must be canonicalized using JCS (JSON Canonicalization Scheme, RFC 8785) before hashing to ensure consistent hash values. See the [Identity Specification](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-identity.md) for complete details.

### Check Attestations

```typescript
async function checkAttestations(did: string, ownerAddress: string, dataHash: string) {
  const didHash = ethers.id(did);
  
  // Check DID ownership
  const ownerVerified = await readContract({
    contract: resolver,
    method: 'function checkDID(bytes32, address) view returns (bool)',
    params: [didHash, ownerAddress]
  });
  
  // Check dataHash attestation
  const dataVerified = await readContract({
    contract: resolver,
    method: 'function checkDataHashAttestation(bytes32, bytes32) view returns (bool)',
    params: [didHash, dataHash]
  });
  
  return {
    ownerVerified,
    dataVerified,
    trustLevel: ownerVerified && dataVerified ? 'HIGH' : 
                ownerVerified ? 'MEDIUM' : 'LOW'
  };
}
```

**Checking for Proofs:** Attestations may include cryptographic proofs for additional verification. When fetching metadata, check for a `proofs` array in attestation data. See the [Proof Specification](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-proofs.md) for details on proof types and verification.

### Complete Verification Flow

```typescript
async function verifyServiceCompletely(did: string, majorVersion: number) {
  // 1. Get app data
  const app = await getService(did, majorVersion);
  
  // 2. Check data integrity
  const integrity = await verifyDataIntegrity(app);
  
  // 3. Check attestations
  const attestations = await checkAttestations(did, app.minter, app.dataHash);
  
  // 4. Fetch metadata
  const metadata = await fetchMetadata(app.dataUrl);
  
  return {
    app,
    metadata,
    integrity,
    attestations,
    trustScore: calculateTrustScore({ integrity, attestations }),
    safeToUse: integrity.valid && attestations.ownerVerified
  };
}

function calculateTrustScore({ integrity, attestations }) {
  let score = 0;
  
  if (integrity.valid) score += 40;
  if (attestations.ownerVerified) score += 30;
  if (attestations.dataVerified) score += 30;
  
  return score; // 0-100
}
```

## Use Case Examples

### Website Trust Badge

Display OMATrust verification on your site:

```typescript
// React component
export function TrustBadge({ did }: { did: string }) {
  const [verification, setVerification] = useState(null);
  
  useEffect(() => {
    verifyServiceCompletely(did, 1).then(setVerification);
  }, [did]);
  
  if (!verification) return <div>Checking verification...</div>;
  
  return (
    <div className="trust-badge">
      {verification.trustScore >= 80 ? (
        <>
          <CheckCircle className="text-green-500" />
          <span>OMATrust Verified ({verification.trustScore}/100)</span>
        </>
      ) : (
        <>
          <AlertCircle className="text-yellow-500" />
          <span>Partially Verified ({verification.trustScore}/100)</span>
        </>
      )}
    </div>
  );
}
```

### API Directory

Build a searchable directory of APIs:

```typescript
async function buildApiDirectory() {
  // Get all services with API interface
  let allApis = [];
  let startIndex = 0;
  
  while (true) {
    const result = await listActiveServices(startIndex, 100);
    
    // Filter for API interface (bit 2)
    const apis = result.apps.filter(app => app.interfaces & 2);
    allApis.push(...apis);
    
    if (result.nextStartIndex === 0) break;
    startIndex = result.nextStartIndex;
  }
  
  // Fetch metadata for each
  const apisWithMetadata = await Promise.all(
    allApis.map(async (app) => ({
      ...app,
      metadata: await fetchMetadata(app.dataUrl).catch(() => null)
    }))
  );
  
  return apisWithMetadata;
}
```

### AI Agent Service Discovery

```python
# Python example for AI agents
import requests
from web3 import Web3
from eth_utils import keccak

def discover_mcp_servers():
    """Find all MCP servers in OMATrust registry"""
    
    # Connect to registry
    w3 = Web3(Web3.HTTPProvider('https://rpc.testnet.chain.oma3.org'))
    registry = w3.eth.contract(address=REGISTRY_ADDRESS, abi=REGISTRY_ABI)
    
    # Search for api:mcp trait
    mcp_trait_hash = keccak(text='api:mcp')
    
    # Get apps with this trait
    # (Note: may need indexer for efficient trait search)
    apps = registry.functions.getAppsByTraits([mcp_trait_hash], 'any').call()
    
    mcp_servers = []
    for app in apps:
        # Fetch metadata
        metadata = requests.get(app['dataUrl']).json()
        
        # Find MCP endpoint in endpoints array
        mcp_endpoint = next(
            (ep for ep in metadata.get('endpoints', []) if ep.get('name') == 'MCP'),
            None
        )
        
        if mcp_endpoint:
            mcp_servers.append({
                'did': app['did'],
                'name': metadata['name'],
                'endpoint': mcp_endpoint['endpoint'],
                'tools': mcp_endpoint.get('tools', []),
                'resources': mcp_endpoint.get('resources', [])
            })
    
    return mcp_servers

# Use discovered servers
servers = discover_mcp_servers()
for server in servers:
    print(f"MCP Server: {server['name']} at {server['endpoint']}")
    print(f"  Tools: {len(server['tools'])}")
```

### Smart Contract Integration

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IOMA3AppRegistry.sol";
import "./IOMA3Resolver.sol";

contract ServiceVerifier {
    IOMAAppRegistry public registry;
    IOMA3Resolver public resolver;
    
    constructor(address _registry, address _resolver) {
        registry = IOMAAppRegistry(_registry);
        resolver = IOMA3Resolver(_resolver);
    }
    
    function verifyAndUseService(string memory did, uint8 major) external {
        // Get service data
        App memory app = registry.getApp(did, major);
        
        // Verify ownership
        bytes32 didHash = keccak256(bytes(did));
        require(
            resolver.checkDID(didHash, app.minter),
            "Service owner not verified"
        );
        
        // Verify status
        require(app.status == 0, "Service not active");
        
        // ✅ Service verified - safe to use
        useService(app.dataUrl);
    }
    
    function useService(string memory endpoint) internal {
        // Your logic here
    }
}
```

## Caching Strategies

### Browser LocalStorage

```typescript
interface CachedService {
  app: App;
  metadata: any;
  verification: VerificationResult;
  cachedAt: number;
}

const CACHE_TTL = 3600000; // 1 hour

async function getServiceCached(did: string, major: number): Promise<CachedService> {
  const cacheKey = `omatrust:${did}:${major}`;
  const cached = localStorage.getItem(cacheKey);
  
  if (cached) {
    const data = JSON.parse(cached);
    if (Date.now() - data.cachedAt < CACHE_TTL) {
      return data;
    }
  }
  
  // Fetch fresh data
  const service = await verifyServiceCompletely(did, major);
  const toCache = { ...service, cachedAt: Date.now() };
  
  localStorage.setItem(cacheKey, JSON.stringify(toCache));
  return toCache;
}
```

### Server-Side Caching

```typescript
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function getServiceCached(did: string, major: number) {
  const cacheKey = `service:${did}:${major}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) return JSON.parse(cached);
  
  const service = await verifyServiceCompletely(did, major);
  await redis.setex(cacheKey, 3600, JSON.stringify(service)); // 1 hour TTL
  
  return service;
}
```

## Rate Limiting

### Client-Side Throttling

```typescript
import pLimit from 'p-limit';

const limit = pLimit(5); // Max 5 concurrent requests

async function fetchServicesWithRateLimit(dids: string[]) {
  return Promise.all(
    dids.map(did => 
      limit(() => getService(did, 1))
    )
  );
}
```

### Batching Requests

```typescript
async function getMultipleServices(queries: Array<{did: string, major: number}>) {
  // Batch RPC calls using multicall pattern
  const calls = queries.map(q => ({
    contract: registry,
    method: 'function getApp(string, uint8) view returns (...)',
    params: [q.did, q.major]
  }));
  
  // Execute in parallel (if RPC supports it)
  const results = await Promise.all(
    calls.map(call => readContract(call))
  );
  
  return results;
}
```

## Error Handling

### Graceful Degradation

```typescript
async function getServiceSafely(did: string, major: number) {
  try {
    const app = await getService(did, major);
    
    // Try to fetch metadata
    try {
      const metadata = await fetchMetadata(app.dataUrl);
      return { app, metadata, error: null };
    } catch (metadataError) {
      // Metadata failed but we have on-chain data
      return {
        app,
        metadata: null,
        error: 'Metadata unavailable - using on-chain data only'
      };
    }
  } catch (error) {
    // Service not found or RPC error
    return {
      app: null,
      metadata: null,
      error: error.message
    };
  }
}
```

### Retry Logic

```typescript
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return fetchWithRetry(fn, retries - 1, delay * 2); // Exponential backoff
  }
}

// Usage
const app = await fetchWithRetry(() => getService(did, major));
```

## UI Patterns

### Service Card Component

```typescript
export function ServiceCard({ did, major }: { did: string; major: number }) {
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    verifyServiceCompletely(did, major)
      .then(setService)
      .finally(() => setLoading(false));
  }, [did, major]);
  
  if (loading) return <Skeleton />;
  if (!service) return <div>Service not found</div>;
  
  return (
    <div className="service-card">
      <img src={service.metadata.image} alt={service.metadata.name} />
      <h3>{service.metadata.name}</h3>
      <p>{service.metadata.description}</p>
      
      {/* Interface badges */}
      <div className="interfaces">
        {service.app.interfaces & 1 && <Badge>Human</Badge>}
        {service.app.interfaces & 2 && <Badge>API</Badge>}
        {service.app.interfaces & 4 && <Badge>Contract</Badge>}
      </div>
      
      {/* Trust indicators */}
      <div className="trust">
        {service.integrity.valid && <CheckCircle className="text-green-500" />}
        {service.attestations.ownerVerified && <Shield className="text-blue-500" />}
        <span>Trust: {service.trustScore}/100</span>
      </div>
      
      {/* Actions */}
      {service.metadata.platforms?.web && (
        <a href={service.metadata.platforms.web.launchUrl}>Launch App</a>
      )}
      {service.metadata.endpoints?.[0] && (
        <a href={service.metadata.endpoints[0].schemaUrl}>View API Docs</a>
      )}
    </div>
  );
}
```

### Trust Badge

```typescript
export function TrustBadge({ did }: { did: string }) {
  const [attestations, setAttestations] = useState(null);
  
  useEffect(() => {
    const didHash = ethers.id(did);
    
    Promise.all([
      readContract({
        contract: resolver,
        method: 'function checkDID(bytes32, address) view returns (bool)',
        params: [didHash, expectedOwner] // Need to know expected owner
      }),
      // Add more attestation checks here
    ]).then(results => {
      setAttestations({
        ownerVerified: results[0],
        // ...
      });
    });
  }, [did]);
  
  if (!attestations) return null;
  
  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 rounded">
      <Shield size={14} />
      <span className="text-xs">OMATrust Verified</span>
    </div>
  );
}
```

## Filtering & Sorting

### Filter by Interface

**Use on-chain filtering:**

```typescript
async function getAppsByInterface(interfaceType: 'human' | 'api' | 'contract' | 'all') {
  const interfaceMask = 
    interfaceType === 'human' ? 1 :
    interfaceType === 'api' ? 2 :
    interfaceType === 'contract' ? 4 :
    7; // all
  
  const result = await readContract({
    contract: registry,
    method: 'function getAppsByInterface(uint16, uint256) view returns (App[], uint256)',
    params: [interfaceMask, 0]
  });
  
  return result[0]; // Array of matching apps
}

// Example
const apiApps = await getAppsByInterface('api');
const humanOrApiApps = await getAppsByInterface('human' | 'api'); // Use mask 3
```

**Or client-side filtering:**

```typescript
function filterByInterface(apps: App[], interfaceType: 'human' | 'api' | 'contract') {
  const bit = interfaceType === 'human' ? 1 : interfaceType === 'api' ? 2 : 4;
  return apps.filter(app => app.interfaces & bit);
}
```

### Sort by Trust Score

```typescript
async function sortByTrust(apps: App[]) {
  // Fetch verification for all
  const appsWithTrust = await Promise.all(
    apps.map(async (app) => ({
      app,
      trustScore: (await checkAttestations(app.did, app.minter, app.dataHash)).trustLevel
    }))
  );
  
  // Sort: HIGH > MEDIUM > LOW
  return appsWithTrust.sort((a, b) => {
    const order = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    return order[b.trustScore] - order[a.trustScore];
  });
}
```

## Performance Optimization

### Indexer Integration (Future)

For production apps with many queries, use an indexer:

```typescript
// GraphQL query to indexer
const QUERY = `
  query GetServices($first: Int, $where: ServiceFilter) {
    services(first: $first, where: $where) {
      did
      version
      interfaces
      dataUrl
      metadata {
        name
        description
        image
      }
      attestations {
        type
        issuer
        timestamp
      }
    }
  }
`;

const result = await fetch('https://indexer.omatrust.org/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: QUERY,
    variables: { first: 100, where: { interfaces_contains: 2 } }
  })
});
```

### Webhook Notifications (Future)

Subscribe to service updates:

```typescript
// Register webhook
await fetch('https://api.omatrust.org/webhooks', {
  method: 'POST',
  body: JSON.stringify({
    url: 'https://myapp.com/webhook',
    events: ['service.registered', 'service.updated', 'attestation.issued'],
    filter: { traits: ['api:rest'] }
  })
});

// Receive notifications
app.post('/webhook', (req, res) => {
  const { event, data } = req.body;
  
  if (event === 'service.registered') {
    console.log(`New service: ${data.did}`);
    // Invalidate cache, refresh directory, etc.
  }
  
  res.sendStatus(200);
});
```

## Best Practices

### 1. Always Verify

Don't trust registry data blindly:
- ✅ Check data integrity (hash verification)
- ✅ Check attestations (ownership, audits)
- ✅ Validate metadata structure
- ✅ Handle missing/invalid data gracefully

### 2. Cache Intelligently

- Cache on-chain data (changes infrequently)
- Cache metadata with shorter TTL (can change)
- Invalidate on version updates
- Use CDN for metadata JSON

### 3. Handle Failures Gracefully

- Network errors (RPC down)
- Missing metadata (dataUrl 404)
- Invalid data (schema mismatch)
- Unverified services (no attestations)

### 4. Respect User Privacy

- Don't track which services users query
- Use privacy-preserving RPC endpoints
- Don't log DID lookups unnecessarily

### 5. Performance

- Batch queries when possible
- Use indexer for search (when available)
- Implement pagination (don't fetch all at once)
- Lazy-load metadata

## SDK Examples (Future)

### Official SDK

```typescript
import { OMATrustClient } from '@oma3/sdk';

const client = new OMATrustClient({
  network: 'testnet',
  clientId: process.env.THIRDWEB_CLIENT_ID
});

// High-level API
const service = await client.getService('did:web:example.com');
const verified = await client.verify(service);
const searchResults = await client.search({ traits: ['gaming'] });
```

## Monitoring & Analytics

### Track Service Health

```typescript
async function monitorService(did: string) {
  const app = await getService(did, 1);
  
  // Check if dataUrl is accessible
  const dataUrlHealthy = await fetch(app.dataUrl)
    .then(() => true)
    .catch(() => false);
  
  // Check if metadata hash matches
  const integrity = await verifyDataIntegrity(app);
  
  // Check attestations
  const attestations = await checkAttestations(did, app.minter, app.dataHash);
  
  return {
    did,
    healthy: dataUrlHealthy && integrity.valid,
    verified: attestations.ownerVerified,
    attested: attestations.dataVerified,
    lastCheck: Date.now()
  };
}

// Monitor every hour
setInterval(() => {
  monitorService('did:web:critical-api.example.com')
    .then(status => {
      if (!status.healthy) {
        alert('Service degraded!');
      }
    });
}, 3600000);
```

## Next Steps

- **[Cookbooks](./cookbooks/register-website.md)** - Practical examples
- **[Auditor Guide](./auditor-guide.md)** - Issue attestations
- **[Integration Examples](./integration-examples.md)** - Complete code samples

---

**Building a client app?** Check out the [integration examples](./integration-examples.md) for complete code samples in TypeScript, Python, and Solidity.


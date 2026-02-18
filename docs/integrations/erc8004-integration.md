---
title: Integration Code Examples
---

# Integration Code Examples

:::caution Draft Documentation
Code examples are provided as-is and may require adaptation for your specific use case. Contract ABIs and addresses are for testnet only. Verify all code before production deployment.
:::

Complete, production-ready code examples for integrating OMATrust into your application.

## TypeScript/JavaScript Examples

### Complete Service Verification

```typescript
import { createThirdwebClient, getContract, readContract } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { ethers } from 'ethers';

// Configuration
const client = createThirdwebClient({ 
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID 
});

const omachainTestnet = defineChain({
  id: 66238,
  rpc: 'https://rpc.testnet.chain.oma3.org'
});

const REGISTRY_ADDRESS = '0xb493465Bcb2151d5b5BaD19d87f9484c8B8A8e83';
const RESOLVER_ADDRESS = '0x7946127D2f517c8584FdBF801b82F54436EC6FC7';

// Contracts
const registry = getContract({
  client,
  chain: omachainTestnet,
  address: REGISTRY_ADDRESS
});

const resolver = getContract({
  client,
  chain: omachainTestnet,
  address: RESOLVER_ADDRESS
});

// Complete verification function
export async function verifyService(did: string, major: number = 1) {
  try {
    // 1. Get service from registry
    const app = await readContract({
      contract: registry,
      method: 'function getApp(string, uint8) view returns (tuple(string did, uint8 versionMajor, tuple(uint8 major, uint8 minor, uint8 patch)[] versionHistory, uint16 interfaces, string dataUrl, bytes32 dataHash, uint8 dataHashAlgorithm, string contractId, string fungibleTokenId, address minter, uint8 status, bytes32[] traitHashes))',
      params: [did, major]
    });
    
    // 2. Fetch metadata from dataUrl
    const metadataResponse = await fetch(app.dataUrl);
    const metadataText = await metadataResponse.text();
    const metadata = JSON.parse(metadataText);
    
    // 3. Verify data integrity
    // IMPORTANT: JSON must be canonicalized using JCS (RFC 8785) before hashing
    // Use a JCS library (e.g., canonicalize) for proper implementation
    const canonicalJson = canonicalize(JSON.parse(metadataText));
    const computedHash = ethers.id(canonicalJson);
    const dataIntegrityValid = computedHash.toLowerCase() === app.dataHash.toLowerCase();
    
    // 4. Check attestations
    const didHash = ethers.id(did);
    
    const ownerVerified = await readContract({
      contract: resolver,
      method: 'function checkDID(bytes32, address) view returns (bool)',
      params: [didHash, app.minter]
    });
    
    const dataHashAttested = await readContract({
      contract: resolver,
      method: 'function checkDataHashAttestation(bytes32, bytes32) view returns (bool)',
      params: [didHash, app.dataHash]
    });
    
    // 5. Calculate trust score
    let trustScore = 0;
    if (dataIntegrityValid) trustScore += 40;
    if (ownerVerified) trustScore += 30;
    if (dataHashAttested) trustScore += 30;
    
    return {
      app: {
        did: app.did,
        version: `${app.versionHistory[app.versionHistory.length - 1].major}.${app.versionHistory[app.versionHistory.length - 1].minor}.${app.versionHistory[app.versionHistory.length - 1].patch}`,
        interfaces: Number(app.interfaces),
        status: Number(app.status),
        minter: app.minter
      },
      metadata,
      verification: {
        dataIntegrityValid,
        ownerVerified,
        dataHashAttested,
        trustScore,
        safeToUse: trustScore >= 70
      }
    };
  } catch (error) {
    console.error('Service verification failed:', error);
    throw error;
  }
}

// Usage
const result = await verifyService('did:web:api.example.com');

if (result.verification.safeToUse) {
  console.log(`✅ ${result.metadata.name} is verified (trust: ${result.verification.trustScore}/100)`);
  // Proceed to use the service
} else {
  console.warn(`⚠️ ${result.metadata.name} has low trust (${result.verification.trustScore}/100)`);
  // Show warning to user
}
```

### React Hook for Service Verification

```typescript
import { useState, useEffect } from 'react';

export function useServiceVerification(did: string, major: number = 1) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    setLoading(true);
    
    verifyService(did, major)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [did, major]);
  
  return { data, loading, error };
}

// Component usage
export function ServiceTrustBadge({ did }: { did: string }) {
  const { data, loading } = useServiceVerification(did);
  
  if (loading) return <Spinner />;
  if (!data) return null;
  
  const { verification, metadata } = data;
  
  return (
    <div className={`trust-badge ${verification.safeToUse ? 'verified' : 'unverified'}`}>
      {verification.safeToUse ? (
        <>
          <CheckCircle className="text-green-500" />
          <span>{metadata.name} - Verified ({verification.trustScore}/100)</span>
        </>
      ) : (
        <>
          <AlertCircle className="text-yellow-500" />
          <span>{metadata.name} - Unverified ({verification.trustScore}/100)</span>
        </>
      )}
    </div>
  );
}
```

**Important:** JSON must be canonicalized using JCS (JSON Canonicalization Scheme, RFC 8785) before hashing for verification to work correctly. See the [Identity Specification](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-identity.md) for complete details.

## Python Examples

### Service Discovery for AI Agents

```python
from web3 import Web3
from eth_utils import keccak
import requests

class OMATrustClient:
    def __init__(self, rpc_url, registry_address, resolver_address):
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))
        self.registry = self.w3.eth.contract(
            address=registry_address,
            abi=REGISTRY_ABI
        )
        self.resolver = self.w3.eth.contract(
            address=resolver_address,
            abi=RESOLVER_ABI
        )
    
    def get_service(self, did: str, major: int = 1):
        """Get service from registry"""
        app = self.registry.functions.getApp(did, major).call()
        return {
            'did': app[0],
            'interfaces': app[3],
            'dataUrl': app[4],
            'dataHash': app[5],
            'minter': app[9],
            'status': app[10]
        }
    
    def fetch_metadata(self, data_url: str):
        """Fetch metadata from dataUrl"""
        response = requests.get(data_url)
        response.raise_for_status()
        return response.json()
    
    def verify_data_integrity(self, data_url: str, expected_hash: str):
        """Verify metadata hash using JCS canonicalization"""
        import json
        from canonicaljson import encode_canonical_json  # or use jcs library
        
        response = requests.get(data_url)
        metadata = response.json()
        
        # IMPORTANT: JSON must be canonicalized using JCS (RFC 8785) before hashing
        canonical_json = encode_canonical_json(metadata).decode('utf-8')
        computed_hash = keccak(text=canonical_json)
        return computed_hash.hex() == expected_hash.hex()
    
    def check_attestations(self, did: str, owner: str, data_hash: str):
        """Check all attestations"""
        did_hash = keccak(text=did)
        
        owner_verified = self.resolver.functions.checkDID(
            did_hash,
            owner
        ).call()
        
        data_verified = self.resolver.functions.checkDataHashAttestation(
            did_hash,
            data_hash
        ).call()
        
        return {
            'owner_verified': owner_verified,
            'data_verified': data_verified
        }
    
    def verify_service_complete(self, did: str, major: int = 1):
        """Complete verification pipeline"""
        # Get service
        service = self.get_service(did, major)
        
        # Fetch metadata
        metadata = self.fetch_metadata(service['dataUrl'])
        
        # Verify integrity
        integrity_valid = self.verify_data_integrity(
            service['dataUrl'],
            service['dataHash']
        )
        
        # Check attestations
        attestations = self.check_attestations(
            did,
            service['minter'],
            service['dataHash']
        )
        
        # Calculate trust
        trust_score = 0
        if integrity_valid:
            trust_score += 40
        if attestations['owner_verified']:
            trust_score += 30
        if attestations['data_verified']:
            trust_score += 30
        
        return {
            'service': service,
            'metadata': metadata,
            'integrity_valid': integrity_valid,
            'attestations': attestations,
            'trust_score': trust_score,
            'safe_to_use': trust_score >= 70
        }

# Usage
client = OMATrustClient(
    'https://rpc.testnet.chain.oma3.org',
    '0xb493465Bcb2151d5b5BaD19d87f9484c8B8A8e83',
    '0x7946127D2f517c8584FdBF801b82F54436EC6FC7'
)

result = client.verify_service_complete('did:web:api.example.com')

if result['safe_to_use']:
    print(f"✅ {result['metadata']['name']} verified (trust: {result['trust_score']}/100)")
    # Get endpoint from endpoints array
    endpoints = result['metadata'].get('endpoints', [])
    if endpoints:
        api_url = endpoints[0]['endpoint']
        # Proceed to use API
else:
    print(f"⚠️ Low trust score: {result['trust_score']}/100")
```

### AI Agent MCP Discovery

```python
class MCPDiscovery:
    def __init__(self, omatrust_client):
        self.client = omatrust_client
    
    def find_mcp_servers(self, capability: str = None):
        """Find all MCP servers, optionally filtered by capability"""
        # Get all services with API interface
        all_services = self.client.get_all_services()
        api_services = [s for s in all_services if s['interfaces'] & 2]  # Bit 2 = API
        
        mcp_servers = []
        for service in api_services:
            # Fetch metadata
            metadata = self.client.fetch_metadata(service['dataUrl'])
            
            # Check if it's an MCP server
            if 'api:mcp' not in metadata.get('traits', []):
                continue
            
            # Find MCP endpoint in endpoints array
            mcp_endpoint = next(
                (ep for ep in metadata.get('endpoints', []) if ep.get('name') == 'MCP'),
                None
            )
            if not mcp_endpoint:
                continue
            
            # Check capability if specified
            if capability:
                tools = mcp_endpoint.get('tools', [])
                if not any(capability in tool['name'] for tool in tools):
                    continue
            
            # Verify before including
            verification = self.client.verify_service_complete(service['did'])
            if verification['trust_score'] < 50:
                continue
            
            mcp_servers.append({
                'did': service['did'],
                'name': metadata['name'],
                'endpoint': mcp_endpoint['endpoint'],
                'tools': [t['name'] for t in mcp_endpoint.get('tools', [])],
                'trust_score': verification['trust_score']
            })
        
        # Sort by trust score
        return sorted(mcp_servers, key=lambda x: x['trust_score'], reverse=True)
    
    async def connect_to_best_mcp(self, capability: str):
        """Find and connect to highest-trust MCP server with capability"""
        servers = self.find_mcp_servers(capability)
        
        if not servers:
            raise Exception(f"No MCP servers found with capability: {capability}")
        
        best_server = servers[0]
        print(f"Connecting to {best_server['name']} (trust: {best_server['trust_score']}/100)")
        
        # Connect using MCP SDK
        from mcp import Client
        client = Client(best_server['endpoint'])
        await client.initialize()
        
        return client

# Usage
discovery = MCPDiscovery(omatrust_client)
mcp_client = await discovery.connect_to_best_mcp('search')
result = await mcp_client.call_tool('search', {'query': 'OMATrust documentation'})
```

## Solidity Examples

### Verify Service in Smart Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IOMA3AppRegistry {
    struct App {
        string did;
        uint8 versionMajor;
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
    
    function getApp(string memory did, uint8 major) external view returns (App memory);
}

interface IOMA3Resolver {
    function checkDID(bytes32 didHash, address controller) external view returns (bool);
    function checkDataHashAttestation(bytes32 didHash, bytes32 dataHash) external view returns (bool);
}

contract ServiceConsumer {
    IOMA3AppRegistry public registry;
    IOMA3Resolver public resolver;
    
    constructor(address _registry, address _resolver) {
        registry = IOMA3AppRegistry(_registry);
        resolver = IOMA3Resolver(_resolver);
    }
    
    function verifyAndUseService(string memory did, uint8 major) external returns (bool) {
        // 1. Get service
        IOMA3AppRegistry.App memory app = registry.getApp(did, major);
        
        // 2. Check status
        require(app.status == 0, "Service not active");
        
        // 3. Verify ownership
        bytes32 didHash = keccak256(bytes(did));
        require(
            resolver.checkDID(didHash, app.minter),
            "Owner not verified"
        );
        
        // 4. Verify dataHash
        require(
            resolver.checkDataHashAttestation(didHash, app.dataHash),
            "Data not attested"
        );
        
        // ✅ Service verified - safe to use
        return true;
    }
    
    function useOnlyTrustedAPIs(string memory did) external view returns (string memory) {
        IOMA3AppRegistry.App memory app = registry.getApp(did, 1);
        
        // Check it's an API (bit 2)
        require(app.interfaces & 2 > 0, "Not an API");
        
        // Check it has api:rest trait
        bytes32 restTrait = keccak256(bytes("api:rest"));
        bool hasRestTrait = false;
        
        for (uint i = 0; i < app.traitHashes.length; i++) {
            if (app.traitHashes[i] == restTrait) {
                hasRestTrait = true;
                break;
            }
        }
        
        require(hasRestTrait, "Not a REST API");
        
        // Return dataUrl for off-chain metadata fetch
        return app.dataUrl;
    }
}
```

### Oracle Implementation

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract OMATrustOracle {
    IOMA3Resolver public resolver;
    address public owner;
    
    mapping(bytes32 => PendingVerification) public pendingVerifications;
    
    struct PendingVerification {
        string did;
        address claimer;
        uint256 requestedAt;
        bool verified;
    }
    
    event VerificationRequested(bytes32 indexed id, string did, address claimer);
    event VerificationCompleted(bytes32 indexed id, bool success);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }
    
    constructor(address _resolver) {
        resolver = IOMA3Resolver(_resolver);
        owner = msg.sender;
    }
    
    // Step 1: User requests verification
    function requestVerification(string memory did) external returns (bytes32) {
        bytes32 id = keccak256(abi.encodePacked(did, msg.sender, block.timestamp));
        
        pendingVerifications[id] = PendingVerification({
            did: did,
            claimer: msg.sender,
            requestedAt: block.timestamp,
            verified: false
        });
        
        emit VerificationRequested(id, did, msg.sender);
        return id;
    }
    
    // Step 2: Oracle verifies off-chain and calls this
    function completeVerification(bytes32 id, bool verified) external onlyOwner {
        PendingVerification storage pending = pendingVerifications[id];
        require(pending.requestedAt > 0, "Verification not found");
        
        if (verified) {
            // Issue attestation to resolver
            bytes32 didHash = keccak256(bytes(pending.did));
            bytes32 controller = bytes32(uint256(uint160(pending.claimer)));
            uint64 expiresAt = uint64(block.timestamp + 365 days);
            
            resolver.upsertDirect(didHash, controller, expiresAt);
            
            pending.verified = true;
        }
        
        emit VerificationCompleted(id, verified);
    }
}
```

## Next.js API Routes

### Verify and Attest Endpoint

```typescript
// pages/api/verify-and-attest.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { did, connectedAddress, requiredSchemas = ['oma3.ownership.v1'] } = req.body;
  
  try {
    // 1. Check for existing attestations (fast path)
    const existing = await checkExistingAttestations(did, connectedAddress, requiredSchemas);
    
    if (existing.missing.length === 0) {
      return res.json({
        ok: true,
        status: 'ready',
        attestations: { present: existing.present, missing: [] },
        message: 'All attestations already exist'
      });
    }
    
    // 2. Verify DID ownership
    let verified = false;
    
    if (did.startsWith('did:web:')) {
      verified = await verifyDidWeb(did, connectedAddress);
    } else if (did.startsWith('did:pkh:')) {
      verified = await verifyDidPkh(did, connectedAddress);
    } else {
      return res.status(400).json({ error: 'Unsupported DID method' });
    }
    
    if (!verified) {
      return res.status(403).json({ 
        ok: false,
        status: 'failed',
        error: 'DID ownership verification failed' 
      });
    }
    
    // 3. Write missing attestations
    const txHashes = [];
    for (const schema of existing.missing) {
      const txHash = await writeAttestation(did, connectedAddress, schema);
      txHashes.push(txHash);
    }
    
    return res.json({
      ok: true,
      status: 'ready',
      attestations: {
        present: [...existing.present, ...existing.missing],
        missing: []
      },
      txHashes
    });
  } catch (error) {
    console.error('Verification failed:', error);
    return res.status(500).json({ 
      ok: false,
      status: 'failed',
      error: error.message 
    });
  }
}

async function checkExistingAttestations(did: string, address: string, schemas: string[]) {
  const resolver = getResolverContract();
  const didHash = ethers.id(did);
  
  const currentOwner = await resolver.currentOwner(didHash);
  const hasValidOwnership = currentOwner && 
    currentOwner.toLowerCase() !== '0x0000000000000000000000000000000000000000' &&
    currentOwner.toLowerCase() === address.toLowerCase();
  
  return {
    present: hasValidOwnership ? schemas : [],
    missing: hasValidOwnership ? [] : schemas
  };
}

async function verifyDidWeb(did: string, claimedOwner: string): Promise<boolean> {
  const domain = did.replace('did:web:', '');
  
  // Try DNS TXT first (fast)
  const dnsVerified = await checkDnsTxt(domain, claimedOwner);
  if (dnsVerified) return true;
  
  // Fallback to DID document
  try {
    const didDoc = await fetch(`https://${domain}/.well-known/did.json`)
      .then(r => r.json());
    
    return didDoc.verificationMethod?.some((method: any) => {
      const accountId = method.blockchainAccountId;
      const address = accountId?.split(':')[2];
      return address?.toLowerCase() === claimedOwner.toLowerCase();
    });
  } catch {
    return false;
  }
}

async function verifyDidPkh(did: string, claimedOwner: string): Promise<boolean> {
  const parts = did.split(':');
  const chainId = parseInt(parts[3]);
  const contractAddress = parts[4];
  
  const provider = new ethers.JsonRpcProvider(getRpcForChain(chainId));
  
  // Try multiple ownership patterns
  const patterns = [
    'function owner() view returns (address)',
    'function admin() view returns (address)',
    'function getOwner() view returns (address)'
  ];
  
  for (const abi of patterns) {
    try {
      const contract = new ethers.Contract(contractAddress, [abi], provider);
      const owner = await contract[abi.split(' ')[1].replace('()', '')]();
      if (owner.toLowerCase() === claimedOwner.toLowerCase()) {
        return true;
      }
    } catch {
      continue;
    }
  }
  
  // Try EIP-1967 proxy admin slot
  try {
    const adminSlot = '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103';
    const adminValue = await provider.getStorage(contractAddress, adminSlot);
    const adminAddress = ethers.getAddress('0x' + adminValue.slice(-40));
    return adminAddress.toLowerCase() === claimedOwner.toLowerCase();
  } catch {
    return false;
  }
}

async function writeAttestation(did: string, address: string, schema: string): Promise<string> {
  const resolver = getResolverContract();
  const didHash = ethers.id(did);
  const controllerAddress = ethers.zeroPadValue(address, 32);
  const expiresAt = 0; // Never expires
  
  const tx = await resolver.upsertDirect(didHash, controllerAddress, expiresAt);
  await tx.wait();
  
  return tx.hash;
}
```

### Metadata Proxy Endpoint

```typescript
// pages/api/service/[did].ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { did } = req.query;
  
  try {
    // Get service
    const app = await registry.getApp(did as string, 1);
    
    // Fetch metadata
    const metadata = await fetch(app.dataUrl).then(r => r.json());
    
    // Verify integrity
    const verified = await verifyDataIntegrity(app);
    
    // Return with verification status
    return res.json({
      ...metadata,
      _omatrust: {
        verified: verified.valid,
        trustScore: await calculateTrustScore(app),
        registryUrl: `https://registry.omatrust.org/service/${did}`
      }
    });
  } catch (error) {
    return res.status(404).json({ error: 'Service not found' });
  }
}
```

## CLI Tool

### Complete CLI for OMATrust

```typescript
#!/usr/bin/env node
import { Command } from 'commander';
import { verifyService } from './lib/omatrust';

const program = new Command();

program
  .name('omatrust')
  .description('OMATrust CLI - Verify and query services')
  .version('1.0.0');

program
  .command('verify <did>')
  .description('Verify a service')
  .option('-m, --major <number>', 'Major version', '1')
  .action(async (did, options) => {
    const result = await verifyService(did, parseInt(options.major));
    
    console.log(`\n📋 Service: ${result.metadata.name}`);
    console.log(`   DID: ${result.app.did}`);
    console.log(`   Version: ${result.app.version}`);
    console.log(`   Status: ${['Active', 'Deprecated', 'Replaced'][result.app.status]}`);
    
    console.log(`\n🔍 Verification:`);
    console.log(`   Data Integrity: ${result.verification.dataIntegrityValid ? '✅' : '❌'}`);
    console.log(`   Owner Verified: ${result.verification.ownerVerified ? '✅' : '❌'}`);
    console.log(`   Data Attested: ${result.verification.dataHashAttested ? '✅' : '❌'}`);
    console.log(`   Trust Score: ${result.verification.trustScore}/100`);
    
    if (result.verification.safeToUse) {
      console.log(`\n✅ SAFE TO USE`);
    } else {
      console.log(`\n⚠️  USE WITH CAUTION (low trust)`);
    }
  });

program
  .command('search <trait>')
  .description('Search services by trait')
  .action(async (trait) => {
    const services = await searchByTrait(trait);
    
    console.log(`\nFound ${services.length} services with trait "${trait}":\n`);
    
    for (const service of services) {
      const metadata = await fetchMetadata(service.dataUrl);
      console.log(`- ${metadata.name} (${service.did})`);
    }
  });

program.parse();
```

**Usage:**
```bash
npm install -g omatrust-cli

omatrust verify did:web:api.example.com
omatrust search api:mcp
```

## GraphQL Client Example

### Query OMATrust Data

```typescript
// Future: GraphQL indexer
const QUERY = `
  query GetServicesByTrait($trait: String!) {
    services(where: { traits_contains: $trait }) {
      did
      version
      interfaces
      metadata {
        name
        description
        endpoint {
          url
          schemaUrl
        }
      }
      attestations {
        type
        issuer
        timestamp
        expiresAt
      }
      trustScore
    }
  }
`;

async function queryServices(trait: string) {
  const response = await fetch('https://indexer.omatrust.org/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: QUERY,
      variables: { trait }
    })
  });
  
  const { data } = await response.json();
  return data.services;
}

// Find all GraphQL APIs
const graphqlApis = await queryServices('api:graphql');
```

## Next Steps

- **[Cookbooks](/app-registry/cookbooks/register-website)** - Specific use cases
- **[Client Guide](/reputation/consumer-workflow)** - More integration patterns
- **[Architecture](/app-registry/registry-concepts)** - Technical deep dive

---

**Need help integrating?** Check the [GitHub examples repository](https://github.com/oma3dao/omatrust-examples) or email support@oma3.org.


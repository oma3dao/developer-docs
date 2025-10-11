---
id: register-api
title: Register an API
sidebar_position: 2
---

# Cookbook: Register an API

:::caution Draft Documentation
API registration process may evolve. Code examples are for testnet. Verify schema requirements before production deployment.
:::

Register your REST API, GraphQL API, or JSON-RPC service to enable discovery and verification by clients and AI agents.

## Use Cases

- **REST APIs** - Publish metadata and enable schema discovery
- **GraphQL APIs** - Link to SDL schema for client code generation
- **JSON-RPC APIs** - Document methods for programmatic access
- **Internal APIs** - Establish trust for B2B integrations
- **Public APIs** - Enable discovery and reputation building

## Prerequisites

- API endpoint (publicly accessible or with auth)
- API documentation or schema (OpenAPI, GraphQL SDL, etc.)
- Web3 wallet with testnet OMA tokens
- (Optional) Domain with `/.well-known/did.json` for did:web

## Example: REST API

### 1. Prepare Your API

**Endpoint:** `https://api.example.com/v1`

**OpenAPI Spec:** `https://api.example.com/openapi.json`

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Example API",
    "version": "1.0.0"
  },
  "servers": [
    { "url": "https://api.example.com/v1" }
  ],
  "paths": {
    "/users": {
      "get": {
        "summary": "List users",
        "responses": {
          "200": { "description": "Success" }
        }
      }
    }
  }
}
```

### 2. Create DID Document

At `https://api.example.com/.well-known/did.json`:

```json
{
  "@context": ["https://www.w3.org/ns/did/v1"],
  "id": "did:web:api.example.com",
  "verificationMethod": [
    {
      "id": "did:web:api.example.com#owner",
      "type": "EcdsaSecp256k1VerificationKey2019",
      "controller": "did:web:api.example.com",
      "blockchainAccountId": "eip155:66238:0xYourWalletAddress"
    }
  ]
}
```

### 3. Register via Wizard

**Step 1 - Verification:**
- Name: "Example API"
- Version: "1.0.0"
- DID: `did:web:api.example.com`
- Interfaces: ☑ API
- API Type: **OpenAPI / REST**
- Verify DID

**Step 2 - On-Chain:**
- Traits: `api:rest`, `public`, `free` (or `pay:x402` if paid)

**Step 3 - Common:**
- Description: "RESTful API for user management and data access"
- Publisher: "Example Corp"
- External URL: `https://example.com`

**Step 7 - API Config:**
- Endpoint URL: `https://api.example.com/v1`
- Schema URL: `https://api.example.com/openapi.json`
- Interface Versions: `v1, v2` (if you support multiple)

**Step 6 - Review & Submit**

### 4. Verify Registration

**Check on dashboard:**
- Should see "Example API v1.0.0"
- Interface badge: "API"
- Traits: api:rest

**Test metadata fetch:**
```bash
curl https://registry.omatrust.org/api/data-url/did:web:api.example.com/v/1.0
```

Should return your metadata JSON.

### 5. Enable Client Discovery

**Add to API homepage:**
```html
<div class="api-trust">
  <h3>Verified API</h3>
  <p>This API is registered and verified on OMATrust</p>
  <a href="https://registry.omatrust.org/service/did:web:api.example.com">
    View Attestations →
  </a>
</div>
```

**Add to API documentation:**
```markdown
## Trust & Verification

This API is registered on OMATrust:
- **DID:** did:web:api.example.com
- **Version:** 1.0.0
- **Attestations:** Owner verified, Data integrity confirmed
- **View on Registry:** https://registry.omatrust.org/service/did:web:api.example.com
```

## Example: GraphQL API

### Registration Differences

**Step 1 - API Type:** Select "GraphQL"

**Step 7 - API Config:**
- Endpoint URL: `https://graphql.example.com/graphql`
- Schema URL: `https://graphql.example.com/graphql?sdl` (or introspection endpoint)

**Metadata:**
```json
{
  "name": "Example GraphQL API",
  "endpoint": {
    "url": "https://graphql.example.com/graphql",
    "schemaUrl": "https://graphql.example.com/schema.graphql"
  },
  "traits": ["api:graphql", "real-time", "subscriptions"]
}
```

### Client Integration

**GraphQL clients can auto-configure:**
```typescript
import { GraphQLClient } from 'graphql-request';
import { buildClientSchema, getIntrospectionQuery } from 'graphql';

async function connectToVerifiedGraphQL(did: string) {
  // 1. Get service from OMATrust
  const service = await getService(did, 1);
  const metadata = await fetchMetadata(service.dataUrl);
  
  // 2. Verify integrity
  const verified = await verifyDataIntegrity(service);
  if (!verified.valid) {
    throw new Error('Service metadata tampered');
  }
  
  // 3. Create client
  const client = new GraphQLClient(metadata.endpoint.url);
  
  // 4. Fetch schema
  const schemaData = await client.request(getIntrospectionQuery());
  const schema = buildClientSchema(schemaData);
  
  return { client, schema };
}
```

## Example: JSON-RPC API

### Blockchain RPC Provider

Register your RPC endpoint:

**Step 1:**
- DID: `did:web:rpc.mychain.org`
- Interfaces: ☑ API
- API Type: **JSON-RPC**

**Step 7:**
- Endpoint URL: `https://rpc.mychain.org`
- Schema URL: `https://docs.mychain.org/rpc-methods.json`

**Metadata:**
```json
{
  "name": "MyChain RPC",
  "description": "High-performance RPC endpoint for MyChain network",
  "endpoint": {
    "url": "https://rpc.mychain.org",
    "schemaUrl": "https://docs.mychain.org/rpc-methods.json"
  },
  "interfaceVersions": ["2.0"],
  "traits": ["api:jsonrpc", "blockchain", "high-performance"]
}
```

## Paid APIs (x402 Integration)

### Register API with x402 Support

**Add trait:** `pay:x402`

**Metadata includes payment info:**
```json
{
  "endpoint": {
    "url": "https://paid-api.example.com/v1"
  },
  "payments": [
    {
      "type": "x402",
      "url": "https://paid-api.example.com/x402",
      "chains": ["eip155:1", "eip155:10", "eip155:8453"]
    }
  ],
  "traits": ["api:rest", "pay:x402", "premium"]
}
```

**Clients check for payment:**
```typescript
const metadata = await fetchMetadata(service.dataUrl);

if (metadata.traits?.includes('pay:x402')) {
  // This is a paid API
  const paymentInfo = metadata.payments?.find(p => p.type === 'x402');
  
  if (paymentInfo) {
    // Query x402 endpoint for pricing
    const pricing = await fetch(`${paymentInfo.url}/supported`).then(r => r.json());
    console.log('Cost per request:', pricing);
  }
}
```

## Multi-Version Management

### Register Multiple Versions

**v1.0 (stable):**
```
DID: did:web:api.example.com
Major: 1
Status: Active
```

**v2.0 (beta):**
```
DID: did:web:api.example.com
Major: 2
Status: Active
```

**Both coexist!** Clients can choose:
```typescript
const stableApi = await getService('did:web:api.example.com', 1);
const betaApi = await getService('did:web:api.example.com', 2);
```

### Deprecation Strategy

```
1. Release v2.0 (keep v1 active)
2. After 6 months, mark v1 as "Deprecated"
3. After 1 year, mark v1 as "Replaced"
4. Clients see warning when using v1
```

## Rate Limiting & Auth

### Document in Metadata

```json
{
  "endpoint": {
    "url": "https://api.example.com/v1",
    "schemaUrl": "https://api.example.com/openapi.json"
  },
  "description": "Rate limit: 1000 req/hour for free tier. See https://example.com/pricing for paid tiers.",
  "traits": ["api:rest", "rate-limited", "auth:api-key"]
}
```

### Authentication Methods

**In traits:**
- `auth:api-key` - Requires API key
- `auth:oauth2` - OAuth 2.0
- `auth:jwt` - JWT tokens
- `auth:blockchain` - Wallet signature

**In schema:**
```json
{
  "security": [
    {
      "ApiKeyAuth": []
    }
  ],
  "components": {
    "securitySchemes": {
      "ApiKeyAuth": {
        "type": "apiKey",
        "in": "header",
        "name": "X-API-Key"
      }
    }
  }
}
```

## Next Steps

- **[Register MCP Server](./register-mcp-server.md)** - AI agent APIs
- **[Register A2A Agent](./register-a2a-agent.md)** - Agent-to-agent
- **[Client Guide](../client-guide.md)** - Query registered APIs

---

**Have an API to register?** Get started at [registry.omatrust.org](https://registry.omatrust.org)!


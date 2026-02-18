---
id: register-mcp-server
title: Register MCP Server
sidebar_position: 3
---

:::caution Preview
This App Registry documentation is in preview and is not production-ready.
:::


# Cookbook: Register MCP Server

:::caution Draft Documentation
MCP integration is new and evolving. Configuration format may change as MCP specification updates. See [modelcontextprotocol.io](https://modelcontextprotocol.io) for latest MCP spec.
:::

Register your Model Context Protocol (MCP) server to enable AI agents to discover and interact with your service.

## What is MCP?

**Model Context Protocol** is a standard for AI agents to interact with external tools and data sources. It allows agents to:
- Call functions (tools)
- Access data (resources)
- Use pre-configured prompts
- Authenticate securely

**Learn more:** [modelcontextprotocol.io](https://modelcontextprotocol.io)

## Prerequisites

- Running MCP server
- MCP configuration (tools, resources, prompts)
- Web3 wallet with testnet OMA tokens
- Domain with DID document (for did:web)

## Quick Start Example

### 1. MCP Server Setup

**Basic MCP server** (Node.js):

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({
  name: 'example-mcp-server',
  version: '1.0.0'
}, {
  capabilities: {
    tools: {},
    resources: {},
    prompts: {}
  }
});

// Define tools
server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'search_knowledge_base',
      description: 'Search the knowledge base',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string' }
        },
        required: ['query']
      }
    }
  ]
}));

// Define resources
server.setRequestHandler('resources/list', async () => ({
  resources: [
    {
      uri: 'file:///docs',
      name: 'Documentation',
      mimeType: 'text/markdown'
    }
  ]
}));

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

### 2. Create MCP Metadata

Prepare your MCP configuration for OMATrust. MCP configuration is placed inside the `endpoints` array:

```json
{
  "endpoints": [
    {
      "name": "MCP",
      "endpoint": "https://mcp.example.com",
      "tools": [
        {
          "name": "search_knowledge_base",
          "description": "Search the knowledge base for information",
          "inputSchema": {
            "type": "object",
            "properties": {
              "query": { "type": "string", "description": "Search query" }
            },
            "required": ["query"]
          }
        },
        {
          "name": "get_documentation",
          "description": "Retrieve documentation for a specific topic",
          "inputSchema": {
            "type": "object",
            "properties": {
              "topic": { "type": "string" }
            }
          }
        }
      ],
      "resources": [
        {
          "uri": "file:///docs",
          "name": "Documentation",
          "description": "Product documentation and guides",
          "mimeType": "text/markdown"
        },
        {
          "uri": "https://api.example.com/data",
          "name": "API Data",
          "description": "Real-time API data feed"
        }
      ],
      "prompts": [
        {
          "name": "explain_feature",
          "description": "Explain a product feature to users",
          "arguments": [
            {
              "name": "feature",
              "description": "Feature name",
              "required": true
            }
          ]
        }
      ],
      "transport": {
        "http": {
          "url": "https://mcp.example.com",
          "method": "POST"
        }
      },
      "authentication": {
        "oauth2": {
          "authorizationUrl": "https://auth.example.com/oauth/authorize",
          "tokenUrl": "https://auth.example.com/oauth/token"
        }
      }
    }
  ]
}
```

### 3. Register via Wizard

**Step 1 - Verification:**
- Name: "Example MCP Server"
- Version: "1.0.0"
- DID: `did:web:mcp.example.com`
- Interfaces: ☑ API
- API Type: **MCP Server**
- Verify DID

**Step 2 - On-Chain:**
- Traits: `api:mcp` (auto-added), `ai`, `knowledge-base`

**Step 3 - Common:**
- Description: "MCP server providing knowledge base search and documentation access for AI agents"
- Publisher: "Example Corp"

**Step 7 - API Config:**
- Click "+ Add Endpoint"
  - Name: "MCP"
  - Endpoint URL: `https://mcp.example.com`
  - Schema URL: `https://mcp.example.com/schema.json` (optional)

**MCP Configuration (inside endpoint):**
- Click "+ Add Tool" for each tool
  - Name: `search_knowledge_base`
  - Description: "Search the knowledge base"
  - Input Schema: `{"type": "object", ...}`
- Click "+ Add Resource" for each resource
  - URI: `file:///docs`
  - Name: "Documentation"
- Click "+ Add Prompt" for each prompt
- Configure transport & authentication (JSON mode)
- Interface Versions: `1.0`

**Step 6 - Review & Submit**

### 4. Test Discovery

**AI agents can now find your MCP server:**

```python
# Python AI agent example
import requests
from web3 import Web3

def discover_mcp_servers():
    # Search OMATrust for MCP servers
    registry_api = "https://registry.omatrust.org/api"
    
    # Get services with api:mcp trait
    response = requests.get(f"{registry_api}/search", params={
        'traits': 'api:mcp',
        'interface': 2
    })
    
    servers = []
    for service in response.json()['results']:
        # Fetch metadata
        metadata = requests.get(service['dataUrl']).json()
        
        # Find MCP endpoint
        mcp_endpoint = next((ep for ep in metadata.get('endpoints', []) if ep.get('name') == 'MCP'), None)
        if mcp_endpoint:
            servers.append({
                'name': metadata['name'],
                'endpoint': mcp_endpoint['endpoint'],
                'tools': [t['name'] for t in mcp_endpoint.get('tools', [])],
                'did': service['did']
            })
    
    return servers

# Discover and use
servers = discover_mcp_servers()
print(f"Found {len(servers)} MCP servers")

for server in servers:
    print(f"\n{server['name']}")
    print(f"  Endpoint: {server['endpoint']}")
    print(f"  Tools: {', '.join(server['tools'])}")
```

## Advanced: Dynamic MCP Configuration

### Generate Config from Code

```typescript
// Auto-generate MCP config from your server
import { inspect } from 'util';

function generateMcpConfig(server: any) {
  const tools = server.getTools().map(tool => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.schema
  }));
  
  const resources = server.getResources().map(resource => ({
    uri: resource.uri,
    name: resource.name,
    description: resource.description,
    mimeType: resource.mimeType
  }));
  
  return {
    tools,
    resources,
    prompts: server.getPrompts(),
    transport: server.transportConfig,
    authentication: server.authConfig
  };
}

// Use in registration
const mcpConfig = generateMcpConfig(myServer);
// Paste into wizard or use programmatic registration
```

### Update When Tools Change

```typescript
// When you add new tools to your MCP server
async function updateMcpMetadata(newTools: Tool[]) {
  const currentMetadata = await fetchMetadata(service.dataUrl);
  
  // Update MCP tools in endpoints array
  const mcpEndpoint = currentMetadata.endpoints.find(ep => ep.name === 'MCP');
  if (mcpEndpoint) {
    mcpEndpoint.tools = newTools;
  }
  
  const updatedMetadata = {
    ...currentMetadata
  };
  
  // Compute new hash
  const jsonString = JSON.stringify(updatedMetadata);
  const newHash = ethers.id(jsonString);
  const newDataUrl = `https://your-domain.com/api/data-url/${did}/v/${major}.${minor}.${patch + 1}`;
  
  // Update on-chain (includes metadata atomically)
  await registry.updateAppControlled(
    did,
    major,
    newDataUrl,
    newHash,
    0, // keccak256
    0, // interfaces (no change)
    [], // traitHashes (no change)
    minor,
    patch + 1, // Increment patch
    jsonString // Metadata stored atomically
  );
}
```

## Authentication Patterns

### OAuth2 for MCP

```json
{
  "mcp": {
    "authentication": {
      "oauth2": {
        "authorizationUrl": "https://auth.example.com/oauth/authorize",
        "tokenUrl": "https://auth.example.com/oauth/token",
        "scopes": ["read:data", "write:data"]
      }
    }
  }
}
```

### Blockchain Auth

```json
{
  "mcp": {
    "authentication": {
      "blockchain": {
        "chainId": "eip155:1",
        "contractAddress": "0x123...",
        "requiredNFT": true
      }
    }
  }
}
```

## Tool Best Practices

### Well-Defined Input Schemas

```json
{
  "name": "analyze_sentiment",
  "description": "Analyze sentiment of text using ML model",
  "inputSchema": {
    "type": "object",
    "properties": {
      "text": {
        "type": "string",
        "description": "Text to analyze",
        "maxLength": 5000
      },
      "language": {
        "type": "string",
        "enum": ["en", "es", "fr", "de"],
        "default": "en",
        "description": "Language of the text"
      }
    },
    "required": ["text"]
  },
  "annotations": {
    "rateLimit": "100/hour",
    "cost": "0.001 OMA per call"
  }
}
```

### Error Handling

```json
{
  "name": "get_weather",
  "description": "Get current weather for a location",
  "inputSchema": { ... },
  "annotations": {
    "errors": {
      "INVALID_LOCATION": "Location not found in database",
      "API_LIMIT_EXCEEDED": "Rate limit exceeded - try again later",
      "SERVICE_UNAVAILABLE": "Weather API temporarily unavailable"
    }
  }
}
```

## Resource Patterns

### Static Resources

```json
{
  "uri": "file:///data/products.json",
  "name": "Product Catalog",
  "description": "Complete product catalog with prices and availability",
  "mimeType": "application/json"
}
```

### Dynamic Resources

```json
{
  "uri": "https://api.example.com/realtime/stock-prices",
  "name": "Stock Prices",
  "description": "Real-time stock price feed",
  "mimeType": "application/json",
  "annotations": {
    "updateFrequency": "1s",
    "authentication": "required"
  }
}
```

## Prompt Engineering

### Pre-configured Prompts

```json
{
  "prompts": [
    {
      "name": "product_recommendation",
      "description": "Generate personalized product recommendations",
      "arguments": [
        {
          "name": "user_preferences",
          "description": "User's stated preferences",
          "required": true
        },
        {
          "name": "budget",
          "description": "Maximum budget",
          "required": false
        }
      ]
    },
    {
      "name": "technical_support",
      "description": "Provide technical support for common issues",
      "arguments": [
        {
          "name": "problem_description",
          "description": "Description of the technical issue"
        }
      ]
    }
  ]
}
```

## Monitoring MCP Servers

### Health Checks

```typescript
async function checkMcpHealth(did: string) {
  const service = await getService(did, 1);
  const metadata = await fetchMetadata(service.dataUrl);
  
  // Ping endpoint
  const healthy = await fetch(metadata.endpoint.url)
    .then(r => r.ok)
    .catch(() => false);
  
  // Verify tools are accessible
  const toolsWork = await testMcpTools(metadata.endpoint.url, metadata.mcp.tools);
  
  return {
    endpointHealthy: healthy,
    toolsHealthy: toolsWork,
    overall: healthy && toolsWork
  };
}
```

### Usage Analytics

Track which agents use your MCP server:

```typescript
// Log in your MCP server
server.onToolCall((tool, params, agentDid) => {
  analytics.log({
    timestamp: Date.now(),
    tool: tool.name,
    agentDid,
    success: true
  });
});

// Aggregate stats
const stats = {
  totalCalls: 15234,
  uniqueAgents: 42,
  mostUsedTool: 'search_knowledge_base',
  avgResponseTime: 245 // ms
};
```

## Versioning MCP Servers

### Interface Versions

```json
{
  "interfaceVersions": ["1.0", "1.1"],
  "mcp": {
    "tools": [
      // v1.0 tools
      { "name": "search", ... },
      
      // v1.1 added tool
      { "name": "advanced_search", ... }
    ]
  }
}
```

### Backward Compatibility

**Strategy:**
1. Add new tools (don't remove old ones)
2. Increment interface version
3. Document changes in schema URL
4. Agents can check `interfaceVersions` and use appropriate tools

## Security Considerations

### Validate Agent Identity

```typescript
// In your MCP server
server.onRequest(async (request, agentInfo) => {
  // Verify agent is registered in OMATrust
  const agentService = await getService(agentInfo.did, 1);
  const verified = await checkAttestations(agentInfo.did, agentService.minter, agentService.dataHash);
  
  if (!verified.ownerVerified) {
    throw new Error('Agent not verified - request denied');
  }
  
  // Process request
  return handleRequest(request);
});
```

### Rate Limiting by Agent

```typescript
const agentRateLimits = new Map();

function checkRateLimit(agentDid: string): boolean {
  const limit = agentRateLimits.get(agentDid) || { count: 0, resetAt: Date.now() + 3600000 };
  
  if (Date.now() > limit.resetAt) {
    limit.count = 0;
    limit.resetAt = Date.now() + 3600000;
  }
  
  if (limit.count >= 1000) {
    return false; // Limit exceeded
  }
  
  limit.count++;
  agentRateLimits.set(agentDid, limit);
  return true;
}
```

## Complete Registration Example

### DID Document

`https://mcp.example.com/.well-known/did.json`:
```json
{
  "@context": ["https://www.w3.org/ns/did/v1"],
  "id": "did:web:mcp.example.com",
  "verificationMethod": [
    {
      "id": "did:web:mcp.example.com#owner",
      "type": "EcdsaSecp256k1VerificationKey2019",
      "controller": "did:web:mcp.example.com",
      "blockchainAccountId": "eip155:66238:0xYourWalletAddress"
    }
  ]
}
```

### Registration Wizard

**Step 1:**
- Name: "Knowledge Base MCP Server"
- Version: "1.0.0"
- DID: `did:web:mcp.example.com`
- Interfaces: ☑ API
- API Type: **MCP Server**

**Step 2:**
- Traits: `api:mcp` (auto), `ai`, `knowledge-base`, `search`

**Step 3:**
- Description: "MCP server providing AI agents access to our knowledge base"
- Publisher: "Example Corp"
- External URL: `https://example.com/mcp`
- Support URL: `https://example.com/mcp/docs`

**Step 7 - MCP Config:**
- Endpoint URL: `https://mcp.example.com`
- Schema URL: `https://mcp.example.com/schema.json`
- Interface Versions: `1.0`

**Add Tools:** (2 tools)
1. search_knowledge_base
2. get_documentation

**Add Resources:** (2 resources)
1. file:///docs
2. https://api.example.com/data

**Add Prompts:** (1 prompt)
1. explain_feature

**Transport & Auth:**
```json
{
  "transport": {"http": {"url": "https://mcp.example.com"}},
  "authentication": {"oauth2": {...}}
}
```

**Submit!**

### Final Metadata

```json
{
  "name": "Knowledge Base MCP Server",
  "description": "MCP server providing AI agents access to our knowledge base",
  "publisher": "Example Corp",
  "external_url": "https://example.com/mcp",
  "supportUrl": "https://example.com/mcp/docs",
  "endpoints": [
    {
      "name": "MCP",
      "endpoint": "https://mcp.example.com",
      "schemaUrl": "https://mcp.example.com/schema.json",
      "interfaceVersions": ["1.0"],
      "tools": [...],
      "resources": [...],
      "prompts": [...],
      "transport": {...},
      "authentication": {...}
    }
  ],
  "traits": ["api:mcp", "ai", "knowledge-base", "search"]
}
```

## AI Agent Integration

### Claude Desktop

AI agents using Claude Desktop can discover your server:

```json
// claude_desktop_config.json
{
  "mcpServers": {
    "example-kb": {
      "command": "node",
      "args": ["/path/to/mcp-client.js"],
      "env": {
        "MCP_SERVER_DID": "did:web:mcp.example.com",
        "OMATRUST_REGISTRY": "https://registry.omatrust.org"
      }
    }
  }
}
```

**Client discovers server:**
```javascript
// mcp-client.js
const { getService, fetchMetadata } = require('./omatrust-sdk');

async function main() {
  const did = process.env.MCP_SERVER_DID;
  
  // Fetch MCP server metadata
  const service = await getService(did, 1);
  const metadata = await fetchMetadata(service.dataUrl);
  
  // Find MCP endpoint
  const mcpEndpoint = metadata.endpoints.find(ep => ep.name === 'MCP');
  if (!mcpEndpoint) throw new Error('No MCP endpoint found');
  
  // Connect to MCP server
  const mcpClient = new MCPClient(mcpEndpoint.endpoint);
  await mcpClient.connect(mcpEndpoint);
  
  // Now Claude can use the tools
  console.log(`Connected to ${metadata.name}`);
  console.log(`Available tools: ${metadata.mcp.tools.map(t => t.name).join(', ')}`);
}

main();
```

### Custom AI Agent

```python
import requests
from mcp import Client

async def connect_to_omatrust_mcp(did: str):
    # Get server info from OMATrust
    service = get_service_from_omatrust(did)
    metadata = requests.get(service['dataUrl']).json()
    
    # Verify before connecting
    verified = verify_service(service)
    if not verified['ownerVerified']:
        raise Exception(f"MCP server {did} not verified")
    
    # Find MCP endpoint
    mcp_endpoint = next((ep for ep in metadata.get('endpoints', []) if ep.get('name') == 'MCP'), None)
    if not mcp_endpoint:
        raise Exception(f"No MCP endpoint found for {did}")
    
    # Connect using MCP SDK
    client = Client(mcp_endpoint['endpoint'])
    await client.initialize()
    
    # List available tools
    tools = await client.list_tools()
    print(f"Connected to {metadata['name']}")
    print(f"Tools: {[t.name for t in tools]}")
    
    return client

# Use the server
client = await connect_to_omatrust_mcp('did:web:mcp.example.com')
result = await client.call_tool('search_knowledge_base', {'query': 'What is OMATrust?'})
```

## Monetization with x402

### Paid MCP Server

```json
{
  "mcp": { ... },
  "payments": [
    {
      "type": "x402",
      "url": "https://mcp.example.com/x402",
      "chains": ["eip155:1", "eip155:10"]
    }
  ],
  "traits": ["api:mcp", "pay:x402", "premium"]
}
```

**Agents check pricing before using:**
```python
metadata = requests.get(service['dataUrl']).json()

if 'pay:x402' in metadata.get('traits', []):
    # Check pricing
    pricing = requests.get(metadata['payments'][0]['url'] + '/supported').json()
    print(f"Cost per tool call: {pricing['perRequest']}")
    
    # Agent decides if cost is acceptable
    if pricing['perRequest'] < max_acceptable_cost:
        # Proceed with payment
        connect_with_payment(metadata)
```

## Testing Your Registration

### Verify Metadata

```bash
# Fetch your metadata
curl https://registry.omatrust.org/api/data-url/did:web:mcp.example.com/v/1.0 | jq '.'

# Should see:
# - mcp object with tools/resources/prompts
# - endpoint.url pointing to your server
# - traits including api:mcp
```

### Test with MCP Client

```bash
# Use MCP inspector
npx @modelcontextprotocol/inspector \
  --server https://mcp.example.com

# Should connect and list your tools
```

## Troubleshooting

**"MCP configuration invalid"**
- Check JSON syntax in tool inputSchemas
- Ensure all required fields present (name, description)
- Validate against MCP spec

**"Tools not appearing for agents"**
- Verify endpoint is accessible
- Check CORS headers (if HTTP transport)
- Ensure authentication works

**"Metadata too large"**
- MCP configs can be large (tools, resources, prompts)
- Use custom dataUrl hosting (not on-chain)
- Keep inputSchemas concise

## Next Steps

- **[Register A2A Agent](./register-a2a-agent.md)** - Agent-to-agent protocol
- **[Client Guide](/reputation/consumer-workflow)** - Query MCP servers
- **MCP Specification:** [modelcontextprotocol.io](https://modelcontextprotocol.io)

---

**Have an MCP server?** Register it at [registry.omatrust.org](https://registry.omatrust.org) to make it discoverable by AI agents!


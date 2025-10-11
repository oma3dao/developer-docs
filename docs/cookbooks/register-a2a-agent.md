---
id: register-a2a-agent
title: Register A2A Agent
sidebar_position: 4
---

# Cookbook: Register A2A Agent

:::caution Draft Documentation
A2A protocol integration is experimental. Agent card format and authentication methods may evolve. Check A2A specification for latest standards.
:::

Register your Agent-to-Agent (A2A) agent to enable trusted interactions with other AI agents in the ecosystem.

## What is A2A?

**Agent-to-Agent (A2A)** is a protocol for AI agents to discover, communicate with, and transact with each other. It enables:
- Agent identity and capabilities discovery
- Secure agent-to-agent communication
- Trust verification before interaction
- Payment and reputation tracking

## Prerequisites

- Running A2A agent
- Agent card at `/.well-known/agent-card.json`
- Web3 wallet with testnet OMA tokens
- Domain with DID document

## Agent Card Structure

### Create Agent Card

File: `https://agent.example.com/.well-known/agent-card.json`

```json
{
  "name": "Customer Support Agent",
  "description": "AI agent specializing in customer support and product recommendations",
  "version": "1.0.0",
  "capabilities": [
    "customer-support",
    "product-recommendations",
    "order-tracking",
    "refund-processing"
  ],
  "endpoints": {
    "communicate": "https://agent.example.com/chat",
    "capabilities": "https://agent.example.com/capabilities",
    "reputation": "https://agent.example.com/reputation"
  },
  "authentication": {
    "methods": ["jwt", "blockchain-signature"],
    "publicKey": "0x04abc123..."
  },
  "pricing": {
    "model": "pay-per-interaction",
    "currency": "OMA",
    "rates": {
      "chat": "0.001",
      "task-execution": "0.01"
    }
  },
  "model": {
    "provider": "OpenAI",
    "version": "gpt-4",
    "specialized": true
  }
}
```

### DID Document

`https://agent.example.com/.well-known/did.json`:

```json
{
  "@context": ["https://www.w3.org/ns/did/v1"],
  "id": "did:web:agent.example.com",
  "verificationMethod": [
    {
      "id": "did:web:agent.example.com#owner",
      "type": "EcdsaSecp256k1VerificationKey2019",
      "controller": "did:web:agent.example.com",
      "blockchainAccountId": "eip155:66238:0xYourWalletAddress"
    },
    {
      "id": "did:web:agent.example.com#agent-key",
      "type": "EcdsaSecp256k1VerificationKey2019",
      "controller": "did:web:agent.example.com",
      "publicKeyHex": "04abc123..." // Agent's public key
    }
  ]
}
```

## Registration Walkthrough

### Step 1 - Verification

**In wizard:**
- Name: "Customer Support Agent"
- Version: "1.0.0"
- DID: `did:web:agent.example.com`
- Interfaces: ☑ API
- API Type: **A2A Agent**
- Click "Verify DID Ownership"

**Verification process:**
1. Oracle fetches `https://agent.example.com/.well-known/did.json`
2. Checks if your wallet in `verificationMethod`
3. Issues attestation
4. Shows "✅ Verified"

### Step 2 - On-Chain

**Traits:** `api:a2a` (auto-added), `customer-support`, `ai-agent`, `conversational`

### Step 3 - Common Metadata

- Description: "AI agent specialized in customer support, product recommendations, and order assistance"
- Publisher: "Example Corp"
- External URL: `https://example.com/agents`
- Support URL: `https://example.com/agent-docs`

### Step 7 - API Configuration

**Endpoint:**
- Agent Card URL: `https://agent.example.com/.well-known/agent-card.json`
- Schema URL: `https://agent.example.com/capabilities-schema.json`

**Interface Versions:** `1.0`

### Step 6 - Review & Submit

**Final metadata:**
```json
{
  "name": "Customer Support Agent",
  "description": "AI agent specialized in customer support...",
  "publisher": "Example Corp",
  "endpoint": {
    "url": "https://agent.example.com/.well-known/agent-card.json",
    "schemaUrl": "https://agent.example.com/capabilities-schema.json"
  },
  "interfaceVersions": ["1.0"],
  "traits": ["api:a2a", "customer-support", "ai-agent", "conversational"]
}
```

## Agent Discovery

### Finding A2A Agents

```typescript
async function discoverA2AAgents(capability?: string) {
  // Search for A2A agents
  const allServices = await listActiveServices();
  const a2aAgents = allServices.apps.filter(app => {
    // Check for API interface and api:a2a trait
    const hasApiInterface = app.interfaces & 2;
    // Would need to check traits (requires indexer or fetching metadata)
    return hasApiInterface;
  });
  
  // Fetch metadata for each
  const agentsWithDetails = await Promise.all(
    a2aAgents.map(async (app) => {
      const metadata = await fetchMetadata(app.dataUrl);
      
      // Filter by capability if specified
      if (capability && !metadata.traits?.includes(capability)) {
        return null;
      }
      
      // Fetch agent card
      const agentCard = await fetch(metadata.endpoint.url).then(r => r.json());
      
      return {
        did: app.did,
        name: metadata.name,
        capabilities: agentCard.capabilities,
        pricing: agentCard.pricing,
        endpoints: agentCard.endpoints
      };
    })
  );
  
  return agentsWithDetails.filter(Boolean);
}

// Find customer support agents
const supportAgents = await discoverA2AAgents('customer-support');
```

### Agent Matchmaking

```typescript
interface AgentRequest {
  taskType: string;
  maxCost: number;
  requiredCapabilities: string[];
}

async function findBestAgent(request: AgentRequest) {
  const agents = await discoverA2AAgents();
  
  // Filter by capabilities
  const capable = agents.filter(agent => 
    request.requiredCapabilities.every(cap => 
      agent.capabilities.includes(cap)
    )
  );
  
  // Filter by cost
  const affordable = capable.filter(agent => 
    parseFloat(agent.pricing.rates[request.taskType]) <= request.maxCost
  );
  
  // Sort by reputation (requires attestations)
  const sorted = await sortByTrust(affordable);
  
  return sorted[0]; // Best match
}
```

## Agent-to-Agent Communication

### Initiating Contact

```typescript
async function contactAgent(targetDid: string, message: any) {
  // 1. Get agent info from OMATrust
  const service = await getService(targetDid, 1);
  const metadata = await fetchMetadata(service.dataUrl);
  
  // 2. Verify agent before trusting
  const verified = await verifyServiceCompletely(targetDid, 1);
  if (verified.trustScore < 70) {
    throw new Error('Agent trust score too low');
  }
  
  // 3. Fetch agent card
  const agentCard = await fetch(metadata.endpoint.url).then(r => r.json());
  
  // 4. Send message to agent's communication endpoint
  const response = await fetch(agentCard.endpoints.communicate, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Agent-DID': 'did:web:my-agent.example.com', // Your agent's DID
      'Authorization': `Bearer ${generateJWT()}`
    },
    body: JSON.stringify(message)
  });
  
  return response.json();
}
```

### Verifying Agent Identity

```typescript
async function verifyAgentBeforeTrust(agentDid: string, signature: string, message: string) {
  // 1. Get agent's public key from DID document
  const didDoc = await fetch(`https://${agentDid.replace('did:web:', '')}/.well-known/did.json`)
    .then(r => r.json());
  
  const agentKey = didDoc.verificationMethod.find(m => m.id.includes('#agent-key'));
  
  // 2. Verify signature
  const recovered = ethers.verifyMessage(message, signature);
  if (recovered !== agentKey.publicKeyHex) {
    throw new Error('Agent signature invalid');
  }
  
  // 3. Check OMATrust attestations
  const service = await getService(agentDid, 1);
  const attestations = await checkAttestations(agentDid, service.minter, service.dataHash);
  
  if (!attestations.ownerVerified) {
    throw new Error('Agent not verified in OMATrust');
  }
  
  return true; // Safe to interact
}
```

## Payment Integration

### x402 for Agent Payments

```json
{
  "payments": [
    {
      "type": "x402",
      "url": "https://agent.example.com/x402",
      "chains": ["eip155:1", "eip155:10", "eip155:8453"]
    }
  ]
}
```

**Agent requests payment:**
```typescript
// Your A2A agent endpoint
app.post('/chat', async (req, res) => {
  const { message, paymentProof } = req.body;
  
  // Verify x402 payment
  const paid = await verifyX402Payment(paymentProof);
  if (!paid) {
    return res.status(402).json({
      error: 'Payment required',
      paymentEndpoint: 'https://agent.example.com/x402'
    });
  }
  
  // Process message
  const response = await processMessage(message);
  res.json(response);
});
```

## Reputation Building

### Track Agent Performance

```typescript
interface AgentMetrics {
  totalInteractions: number;
  successRate: number;
  avgResponseTime: number;
  userSatisfaction: number;
  attestations: number;
}

async function trackAgentMetrics(agentDid: string): Promise<AgentMetrics> {
  // Fetch from monitoring service
  const response = await fetch(`https://reputation.oma3.org/api/agents/${agentDid}/metrics`);
  return response.json();
}
```

### Request Attestations

**Performance attestation:**
```typescript
// After 30 days of uptime
await submitPerformanceAttestation({
  did: 'did:web:agent.example.com',
  uptime: 99.97,
  avgResponseTime: 150,
  successfulInteractions: 10000,
  period: '30d'
});
```

**User satisfaction:**
```typescript
// After each interaction
await submitUserReview({
  agentDid: 'did:web:agent.example.com',
  rating: 5,
  category: 'helpfulness',
  comment: 'Solved my issue quickly'
});
```

## Multi-Agent Systems

### Agent Discovery Service

```typescript
class AgentDiscoveryService {
  async findAgentsForTask(task: string, constraints: any) {
    // Query OMATrust for A2A agents
    const agents = await discoverA2AAgents();
    
    // Filter by task capability
    const capable = agents.filter(agent => 
      agent.capabilities.includes(task)
    );
    
    // Apply constraints (cost, trust, etc.)
    const filtered = capable.filter(agent => 
      this.meetsConstraints(agent, constraints)
    );
    
    // Rank by reputation
    const ranked = await this.rankByReputation(filtered);
    
    return ranked;
  }
  
  async rankByReputation(agents: Agent[]) {
    const withScores = await Promise.all(
      agents.map(async (agent) => ({
        agent,
        score: await this.getReputationScore(agent.did)
      }))
    );
    
    return withScores
      .sort((a, b) => b.score - a.score)
      .map(item => item.agent);
  }
}
```

### Orchestration

```typescript
async function orchestrateAgents(task: ComplexTask) {
  // Break down task
  const subtasks = decomposeTask(task);
  
  // Find best agent for each subtask
  const assignments = await Promise.all(
    subtasks.map(async (subtask) => ({
      subtask,
      agent: await findBestAgent({
        taskType: subtask.type,
        maxCost: task.budget / subtasks.length,
        requiredCapabilities: subtask.requirements
      })
    }))
  );
  
  // Execute in parallel
  const results = await Promise.all(
    assignments.map(({ subtask, agent }) => 
      contactAgent(agent.did, subtask)
    )
  );
  
  // Aggregate results
  return combineResults(results);
}
```

## Security Best Practices

### Validate Agent Claims

```typescript
async function validateAgentClaims(agentDid: string, agentCard: any) {
  // 1. Verify agent card hash matches OMATrust metadata
  const service = await getService(agentDid, 1);
  const metadata = await fetchMetadata(service.dataUrl);
  
  const fetchedCard = await fetch(metadata.endpoint.url).then(r => r.text());
  const cardHash = ethers.id(fetchedCard);
  
  // Agent card should be included in dataHash verification
  
  // 2. Check capabilities match traits
  const declaredCapabilities = agentCard.capabilities;
  const registeredTraits = metadata.traits;
  
  // Ensure alignment
  const validated = declaredCapabilities.every(cap => 
    registeredTraits.some(trait => trait.includes(cap))
  );
  
  return validated;
}
```

### Rate Limit Agent Interactions

```typescript
const agentInteractionLimits = new Map();

function checkAgentRateLimit(agentDid: string): boolean {
  const limit = agentInteractionLimits.get(agentDid) || {
    count: 0,
    resetAt: Date.now() + 60000 // 1 minute window
  };
  
  if (Date.now() > limit.resetAt) {
    limit.count = 0;
    limit.resetAt = Date.now() + 60000;
  }
  
  if (limit.count >= 100) {
    return false; // Limit: 100 interactions per minute
  }
  
  limit.count++;
  agentInteractionLimits.set(agentDid, limit);
  return true;
}
```

## Complete Example

### Customer Support Agent

**Agent card:**
```json
{
  "name": "SupportBot 3000",
  "description": "24/7 customer support AI agent with product knowledge and order management",
  "version": "1.0.0",
  "capabilities": [
    "answer-questions",
    "track-orders",
    "process-refunds",
    "escalate-to-human"
  ],
  "endpoints": {
    "communicate": "https://support.example.com/api/chat",
    "capabilities": "https://support.example.com/api/capabilities",
    "status": "https://support.example.com/api/status"
  },
  "authentication": {
    "methods": ["api-key", "jwt"],
    "publicKey": "0x04..."
  },
  "pricing": {
    "model": "subscription",
    "tiers": {
      "free": { "limit": "100/day", "cost": 0 },
      "pro": { "limit": "unlimited", "cost": 0.1 }
    }
  },
  "sla": {
    "uptime": "99.9%",
    "avgResponseTime": "2s",
    "maxConcurrent": 1000
  }
}
```

**OMATrust registration:**
```json
{
  "name": "SupportBot 3000",
  "description": "24/7 customer support AI agent",
  "publisher": "Example Corp",
  "endpoint": {
    "url": "https://support.example.com/.well-known/agent-card.json",
    "schemaUrl": "https://support.example.com/agent-schema.json"
  },
  "interfaceVersions": ["1.0"],
  "traits": ["api:a2a", "customer-support", "ai-agent", "24/7"]
}
```

### Discovery by Other Agents

```python
# Another AI agent looking for customer support capability
import requests

def find_support_agent():
    # Query OMATrust for A2A agents with customer-support capability
    registry_api = "https://registry.omatrust.org/api"
    
    response = requests.get(f"{registry_api}/search", params={
        'traits': 'customer-support,api:a2a',
        'interface': 2
    })
    
    for service in response.json()['results']:
        metadata = requests.get(service['dataUrl']).json()
        agent_card = requests.get(metadata['endpoint']['url']).json()
        
        # Check if agent meets requirements
        if 'process-refunds' in agent_card['capabilities']:
            return {
                'did': service['did'],
                'name': metadata['name'],
                'endpoint': agent_card['endpoints']['communicate'],
                'pricing': agent_card['pricing']
            }
    
    return None

# Use discovered agent
agent = find_support_agent()
if agent:
    response = requests.post(agent['endpoint'], json={
        'message': 'I need help with order #12345',
        'from_agent': 'did:web:my-agent.com'
    })
```

## Authentication Patterns

### JWT-Based Auth

**Agent card:**
```json
{
  "authentication": {
    "methods": ["jwt"],
    "jwksUrl": "https://agent.example.com/.well-known/jwks.json",
    "issuer": "did:web:agent.example.com"
  }
}
```

**Requesting agent generates JWT:**
```typescript
import jwt from 'jsonwebtoken';

const token = jwt.sign(
  {
    sub: 'did:web:requesting-agent.com',
    aud: 'did:web:agent.example.com',
    task: 'customer-support-query'
  },
  privateKey,
  { expiresIn: '5m' }
);

const response = await fetch(agentEndpoint, {
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(message)
});
```

### Blockchain Signature Auth

```typescript
async function callAgentWithSignature(agentEndpoint: string, message: any, wallet: any) {
  // Sign message
  const signature = await wallet.signMessage(JSON.stringify(message));
  
  // Send with signature
  const response = await fetch(agentEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Agent-DID': wallet.did,
      'X-Signature': signature
    },
    body: JSON.stringify(message)
  });
  
  return response.json();
}
```

## Reputation & Trust

### Publish Performance Metrics

```json
// In agent card
{
  "metrics": {
    "totalInteractions": 50000,
    "successRate": 98.5,
    "avgResponseTime": 1.8,
    "userSatisfaction": 4.7,
    "uptime": 99.95
  },
  "attestations": [
    {
      "type": "uptime",
      "issuer": "did:web:monitor.oma3.org",
      "timestamp": 1735689600,
      "value": 99.95
    }
  ]
}
```

### Request Attestations

**After proving reliability:**
```bash
# Contact attestation service
curl -X POST https://reputation.oma3.org/api/request-attestation \
  -H "Content-Type: application/json" \
  -d '{
    "did": "did:web:agent.example.com",
    "type": "performance",
    "metrics": {
      "uptime": 99.95,
      "interactions": 50000,
      "successRate": 98.5
    }
  }'
```

## Multi-Agent Scenarios

### Agent Delegation

```typescript
// Agent A delegates task to Agent B
async function delegateTask(task: any, targetAgentDid: string) {
  // Verify target agent can handle task
  const targetService = await getService(targetAgentDid, 1);
  const metadata = await fetchMetadata(targetService.dataUrl);
  const agentCard = await fetch(metadata.endpoint.url).then(r => r.json());
  
  if (!agentCard.capabilities.includes(task.type)) {
    throw new Error('Agent not capable of this task');
  }
  
  // Check trust
  const trust = await checkAttestations(targetAgentDid, targetService.minter, targetService.dataHash);
  if (!trust.ownerVerified) {
    throw new Error('Agent not verified');
  }
  
  // Delegate
  const result = await contactAgent(targetAgentDid, {
    task,
    delegatedBy: 'did:web:my-agent.com',
    paymentInfo: { ... }
  });
  
  return result;
}
```

### Agent Swarms

```typescript
// Coordinate multiple agents for complex task
async function coordinateAgentSwarm(task: ComplexTask) {
  const requiredCapabilities = analyzeTask(task);
  
  // Find specialized agents for each capability
  const agents = await Promise.all(
    requiredCapabilities.map(cap => 
      discoverA2AAgents(cap).then(agents => agents[0]) // Best agent for capability
    )
  );
  
  // Execute in parallel
  const results = await Promise.all(
    agents.map((agent, i) => 
      contactAgent(agent.did, {
        subtask: task.subtasks[i],
        coordination: {
          swarmId: task.id,
          totalAgents: agents.length,
          agentRole: requiredCapabilities[i]
        }
      })
    )
  );
  
  // Aggregate results
  return mergeResults(results);
}
```

## Monitoring & Debugging

### Agent Health Check

```typescript
async function checkAgentHealth(agentDid: string) {
  const service = await getService(agentDid, 1);
  const metadata = await fetchMetadata(service.dataUrl);
  const agentCard = await fetch(metadata.endpoint.url).then(r => r.json());
  
  // Ping status endpoint
  const status = await fetch(agentCard.endpoints.status).then(r => r.json());
  
  return {
    online: status.online,
    load: status.currentLoad,
    queueSize: status.queueSize,
    lastError: status.lastError,
    uptime: status.uptime
  };
}
```

### Debug Agent Interactions

```typescript
// Log all agent interactions
const interactionLog = [];

async function loggedContactAgent(targetDid: string, message: any) {
  const startTime = Date.now();
  
  try {
    const result = await contactAgent(targetDid, message);
    
    interactionLog.push({
      timestamp: startTime,
      targetDid,
      message,
      result,
      duration: Date.now() - startTime,
      success: true
    });
    
    return result;
  } catch (error) {
    interactionLog.push({
      timestamp: startTime,
      targetDid,
      message,
      error: error.message,
      duration: Date.now() - startTime,
      success: false
    });
    
    throw error;
  }
}
```

## Updating Your Agent

### Version Updates

**Minor update (new capability):**
```
1. Add capability to agent card
2. Update metadata version: 1.0.0 → 1.1.0
3. Use wizard "Edit" or call setMetadataJson
4. Version history updated automatically
```

**Major update (breaking change):**
```
1. Register as new major version
2. DID: same
3. Major: 2 (instead of 1)
4. Update agent card URL
5. Both versions coexist
```

## Next Steps

- **[Register Smart Contract](./register-smart-contract.md)** - On-chain services
- **[Client Guide](../client-guide.md)** - Query agents
- **[Auditor Guide](../auditor-guide.md)** - Get attestations

---

**Ready to register your A2A agent?** Head to [registry.omatrust.org](https://registry.omatrust.org)!


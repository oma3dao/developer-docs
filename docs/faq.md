---
id: faq
title: Frequently Asked Questions
sidebar_position: 9
---

# Frequently Asked Questions

:::caution Draft Documentation
FAQs are based on current understanding and may not reflect final implementation. For the most current information, visit [registry.omatrust.org](https://registry.omatrust.org).
:::

## General

### What is OMATrust?

OMATrust is a decentralized trust layer for the open internet. It allows services (websites, APIs, smart contracts, AI agents) to be registered on-chain with verifiable metadata and cryptographic attestations, enabling users and AI agents to verify legitimacy before trusting a service.

### Why do I need OMATrust?

**If you're a service provider:**
- Build verifiable reputation
- Increase discoverability
- Compete on merit, not platform politics
- Enable AI agents to discover and trust your service

**If you're a user/client:**
- Verify services before using them
- See real audits, not fake badges
- Make informed decisions based on attestations

### Is OMATrust a blockchain?

No. OMATrust is a **cross-chain protocol** that works on multiple blockchains. The primary coordination layer is OMAchain (an Ethereum L2), but OMATrust services can be registered on Ethereum, Optimism, Base, and other chains.

### How much does it cost?

**Testnet:** Free! Get tokens from [faucet.testnet.chain.oma3.org](https://faucet.testnet.chain.oma3.org)

**Mainnet (future):**
- Registration: ~$1-5 (gas costs)
- Metadata updates: ~$0.50-2
- Attestation queries: Free (read operations)

## Registration

### What can I register?

- ✅ Websites and web apps
- ✅ REST APIs, GraphQL APIs, JSON-RPC services
- ✅ MCP servers (for AI agents)
- ✅ A2A agents
- ✅ Smart contracts (ERC-20, ERC-721, DeFi protocols, etc.)
- ✅ Downloadable applications (with artifact verification)

### Do I need a domain to register?

**For did:web:** Yes, you need a domain where you can place a DID document at `/.well-known/did.json`

**For did:pkh (smart contracts):** No, the DID is derived from the blockchain address

### Can I register multiple versions?

Yes! Major versions are separate:
- `did:web:api.example.com` + major: 1 → v1.x.x
- `did:web:api.example.com` + major: 2 → v2.x.x

Both can coexist. Mark old versions as "Deprecated" when releasing new major versions.

### Can I update metadata after registration?

**Yes!** Two methods:

**1. Default dataUrl (on-chain storage):**
- Click "Edit" in dashboard
- Update fields
- Submit transaction
- Version history updated automatically

**2. Custom dataUrl (you host):**
- Update JSON at your endpoint
- Call `updateAppControlled()` with new hash and metadata
- Version history updated atomically

### Can I transfer ownership?

Yes, app NFTs are standard ERC-721 tokens:
```typescript
await registry.transferFrom(yourAddress, newOwnerAddress, tokenId);
```

New owner can update metadata and manage the app.

### What if I lose access to my wallet?

**No recovery mechanism** - this is blockchain. Best practices:
- Use hardware wallet
- Backup seed phrase securely
- Consider multi-sig for important services
- Test on testnet first

## Technical

### What's the difference between DID and contract ID?

**DID (Decentralized Identifier):**
- Primary identifier for the service
- Format: `did:web:example.com` or `did:pkh:eip155:1:0x...`
- Used for registry lookups

**Contract ID (CAIP-10):**
- Optional field for services with associated smart contract
- Format: `eip155:1:0xContractAddress`
- Links off-chain service to on-chain contract
- Example: API service that manages an NFT contract

**Example:**
```
DID: did:web:nft-api.example.com (API service)
Contract ID: eip155:1:0xNFTContract (NFT it manages)
```

### What's dataHash and why does it matter?

**DataHash** is a cryptographic hash (keccak256 or sha256) of your metadata JSON. It enables:

1. **Integrity verification** - Detect if metadata was tampered with
2. **Attestations** - Issuers can attest they verified the hash
3. **Auditing** - Track metadata changes over time

**Example:**
```typescript
metadata = '{"name":"My App",...}'
dataHash = keccak256(metadata)
// 0xabc123...

// Later, verify:
fetchedMetadata = fetch(dataUrl)
computedHash = keccak256(fetchedMetadata)

if (computedHash === dataHash) {
  // ✅ Metadata unchanged
}
```

### Why store metadata by DID only (not versioned DID)?

**Gas efficiency!** Storing every version would be extremely expensive.

**Instead:**
- Metadata stored once per DID
- Version history tracked via blockchain events
- Events include version numbers + timestamps
- Can reconstruct any version from events

**Trade-off:**
- Can't query old metadata directly from contract
- Must reconstruct from events + dataUrl archives
- For most use cases, latest metadata is all you need

### Can I use OMATrust without blockchain knowledge?

**Yes!** The web interface at [registry.omatrust.org](https://registry.omatrust.org) handles all blockchain interactions:

- Social login (Google, email) - no wallet needed
- Wizard guides you through registration
- Automatic attestations
- No smart contract knowledge required

For advanced features (programmatic access, custom contracts), blockchain knowledge helps.

## Attestations

### How do I get my service attested?

**Automatic (free):**
- DID ownership - Issued when you verify in wizard
- DataHash - Issued when you register

**Manual (paid/requested):**
- Security audits - Contact audit firms
- Compliance certifications - Get certified, submit proof
- User reviews - Encourage users to visit reputation.oma3.org

### How long do attestations last?

**Configurable expiration:**
- DID ownership: 1 year (renewable)
- DataHash: 1 year (renew when metadata changes)
- Security audits: 6-12 months (audit firms decide)
- Uptime: 30 days (continuous monitoring)

Attestations must be renewed before expiration.

### What if an attestation expires?

- Service still registered (NFT persists)
- Trust score decreases
- Clients may show warnings
- Re-verify to renew attestation

### Can attestations be revoked?

**Yes**, by the issuer:
- Set expiration to current timestamp
- Used when service is compromised
- When verification no longer valid

## Discovery & Search

### How do users find my service?

**1. Direct link:**
- Share: `https://registry.omatrust.org/service/{yourDID}`

**2. Search by traits:**
- Users search for "gaming" → sees your app if you have that trait

**3. Interface filter:**
- API directory shows only API services
- Contract directory shows only contracts

**4. Reputation ranking:**
- Higher trust score → higher in results

**5. External indexers (future):**
- Google-like search across OMATrust
- AI agent discovery services

### What traits should I use?

**API type (auto-added):**
- `api:rest`, `api:graphql`, `api:mcp`, etc.

**Payment:**
- `pay:x402` - If you accept x402 micropayments

**Category:**
- `gaming`, `defi`, `social`, `ai`, `enterprise`, `healthcare`, etc.

**See full list:** [Trait Appendix in Identity Specification](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-identity.md#appendix-c)

### Can I remove my service from the registry?

**Not fully** - blockchain is immutable. But you can:
- Mark as "Deprecated" or "Replaced"
- Remove from public search (status != Active)
- Delete metadata (if you control dataUrl)
- Transfer NFT to null address (burn)

Services marked as deprecated don't appear in public queries.

## Integrations

### How do AI agents discover MCP servers?

```python
# Agent queries OMATrust
servers = omatrust_client.search(traits=['api:mcp'])

# For each server
for server in servers:
    metadata = requests.get(server['dataUrl']).json()
    
    # Get MCP configuration
    mcp_config = metadata['mcp']
    endpoint = metadata['endpoint']['url']
    
    # Connect to MCP server
    client = MCPClient(endpoint)
    await client.connect(mcp_config)
```

### Can I use OMATrust in mobile apps?

**Yes!** Same as web:
```typescript
import { verifyService } from '@oma3/sdk'; // Future official SDK

const result = await verifyService('did:web:api.example.com');

if (result.verification.safeToUse) {
  // Safe to use in your app
}
```

### Does OMATrust work with IPFS?

**Yes**, for metadata hosting:
```
dataUrl: ipfs://QmHash
```

**Benefits:**
- Decentralized hosting
- Content-addressed (hash = address)
- Censorship resistant

**Trade-offs:**
- Availability depends on pinning
- Slower than HTTP (sometimes)
- Need IPFS gateway for browsers

## Costs & Economics

### How much gas does registration cost?

**Testnet:** Free (faucet tokens)

**Mainnet estimates (at 1 gwei):**
- Mint app: ~500k gas = ~$1-2
- Update metadata: ~200k gas = ~$0.50-1
- Update status: ~50k gas = ~$0.10-0.20

Gas costs vary with network congestion.

### Are there ongoing costs?

**Only if:**
- Hosting custom dataUrl (hosting costs)
- Updating metadata frequently (gas)
- Renewing attestations (auditor fees)

**No costs for:**
- Keeping registration active
- Clients querying your service
- Displaying on directories

### Can I monetize my attestations?

**As an issuer:** Yes!
- Charge for security audits
- Subscription for monitoring
- Premium attestation services

**Revenue share with OMA3:** Not currently, but governance may implement protocol fees in future.

## Security & Privacy

### Is my data on-chain?

**What's on-chain:**
- DID, version, interfaces (always)
- Traits (as hashes)
- DataHash (not the data itself)
- Optionally: Full metadata JSON (if you choose on-chain storage)

**What's off-chain:**
- Usually: Full metadata JSON (at dataUrl)
- Can be: Hosted by you or OMATrust

### Can services track who queries them?

**On-chain queries:** No
- Reading from blockchain is anonymous
- No way to track who called view functions

**Off-chain (dataUrl):** Potentially
- If you host dataUrl, you see HTTP requests
- Can log IP addresses, user agents
- GDPR/privacy laws apply

**Recommendation:** Use IPFS or privacy-preserving dataUrl hosting.

### What if a service is malicious?

**Report it:**
1. Flag on reputation.oma3.org
2. Alert OMA3 governance
3. Request attestation revocation from issuers

**Protection mechanisms:**
- Attestations expire (must be renewed)
- Community can flag issues
- Issuers can revoke attestations
- Services can be marked "Deprecated"

## Troubleshooting

### "DID verification failed"

**Causes:**
- DID document not accessible
- Wallet address not in DID document
- Incorrect DID format
- For contracts: wallet not the owner

**Solutions:**
- Verify `/.well-known/did.json` is accessible via HTTPS
- Check wallet address matches exactly
- Ensure DID follows format: `did:web:example.com`

### "Transaction failed"

**Common reasons:**
- Insufficient gas
- DID + major version already registered
- Invalid metadata format
- Network congestion

**Solutions:**
- Get more tokens from faucet
- Use different major version
- Validate JSON in wizard
- Try again later or increase gas

### "Metadata not loading"

**Causes:**
- DataUrl endpoint down
- CORS not configured
- Invalid JSON
- Network timeout

**Solutions:**
- Check dataUrl is accessible
- Add CORS header: `Access-Control-Allow-Origin: *`
- Validate JSON syntax
- Use reliable hosting

### "Attestation not found"

**Causes:**
- Issuer hasn't processed yet (wait 1-2 minutes)
- Maturation period (60 seconds)
- Verification failed

**Solutions:**
- Wait and retry
- Check verification logs
- Re-run verification

## Roadmap & Future Features

### Coming Soon

- **EAS integration** - Structured attestation schemas
- **Cross-chain deployment** - Ethereum, Optimism, Base
- **Deduplication** - Prevent duplicate registrations
- **Indexer** - Fast search and discovery
- **SDK** - Official TypeScript/Python libraries
- **Mobile apps** - Native iOS/Android

### Planned Features

- **User reviews** - On-chain reputation from verified users
- **Continuous monitoring** - Real-time trust scores
- **Attestation marketplace** - Buy/sell verification services
- **Integration plugins** - WordPress, Shopify, Webflow
- **AI agent swarms** - Multi-agent coordination with trust

### Governance

**How decisions are made:**
- OMA3 is a Swiss non-profit
- Community governance for protocol changes
- Transparent decision-making
- Open participation

**Get involved:**
- Participate in governance forums
- Submit proposals
- Vote on changes (token-based, future)

## Support & Resources

### Where can I get help?

- **Documentation:** https://docs.omatrust.org
- **GitHub:** https://github.com/oma3dao
- **Email:** support@oma3.org

### How do I report bugs?

**Frontend bugs:**
- GitHub: https://github.com/oma3dao/app-registry-frontend/issues

**Smart contract bugs:**
- **DO NOT** post publicly if security-critical
- Email: security@oma3.org
- Responsible disclosure: 90-day window

**Documentation issues:**
- GitHub: https://github.com/oma3dao/developer-docs/issues

### How can I contribute?

**Ways to contribute:**
- Write documentation
- Build integrations
- Issue attestations (become issuer/oracle)
- Participate in governance
- Spread the word

**Developer contributions:**
- Submit PRs on GitHub
- Build example integrations
- Create SDKs for other languages
- Develop indexers or tools

## Next Steps

- **[Get Started](./registration-guide.md)** - Register your first service
- **[Cookbooks](./cookbooks/register-website.md)** - Specific examples
- **[Architecture](./architecture.md)** - Technical deep dive

---

**Still have questions?** Email support@oma3.org.


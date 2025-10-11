---
id: attestations
title: Attestation Framework
sidebar_position: 4
---

# Attestation Framework

:::caution Draft Documentation
Attestation schemas and processes are still being finalized. Future integration with EAS (Ethereum Attestation Service) may change implementation details. Check [reputation.oma3.org](https://reputation.oma3.org) for current status.
:::

Attestations are the foundation of trust in OMATrust. They provide cryptographic proof that a service has been verified, audited, or reviewed by trusted third parties.

## What are Attestations?

An **attestation** is a cryptographically signed statement about a service, stored on-chain:

```
"I, [Issuer], verify that [Service] has [Property]"

Examples:
- "Trail of Bits verifies that did:web:defi.example.com passed security audit on 2025-01-15"
- "Oracle verifies that did:web:api.example.com owns the domain"
- "User Alice gives did:web:game.example.com a 5-star rating"
```

**Properties:**
- **Immutable** - Can't be changed after issuance
- **Timestamped** - Includes issuance date
- **Cryptographically Signed** - Issuer's signature proves authenticity
- **On-Chain** - Publicly queryable and verifiable

## Types of Attestations

### 1. DID Ownership Attestations

**Purpose:** Prove the service owner controls the DID

**Issued by:** OMATrust oracle (automated)

**Schemas:**
- `OMA3/DIDOwnership` - General DID control
- `OMA3/DomainOwnership` - Specific to did:web
- `OMA3/ContractOwnership` - Specific to did:pkh

**Verification Methods:**

**For did:web:**
```
1. Fetch https://example.com/.well-known/did.json
2. Check if wallet address in DID document
3. Issue attestation if match found
```

**For did:pkh:**
```
1. Extract contract address from DID
2. Query contract.owner() or contract.admin()
3. Verify matches connected wallet
4. Issue attestation
```

### 2. DataHash Attestations

**Purpose:** Verify the integrity of metadata at dataUrl

**Issued by:** OMATrust oracle (automated on registration)

**Flow:**
```typescript
// 1. App registers with dataUrl
dataUrl: "https://api.example.com/metadata.json"
dataHash: "0xabc123..." (keccak256 of JSON content)

// 2. Oracle fetches and verifies
const fetched = await fetch(dataUrl);
const computed = keccak256(fetched);

if (computed === dataHash) {
  // 3. Issue attestation
  await resolver.attestDataHash(didHash, dataHash);
}
```

**Clients can verify:**
```typescript
const verified = await resolver.checkDataHashAttestation(didHash, dataHash);
if (verified) {
  // ✅ Metadata hasn't been tampered with
  // ✅ Oracle confirmed the hash
}
```

### 3. Security Audit Attestations

**Purpose:** Prove a service passed professional security review

**Issued by:** Security firms, auditing companies

**Examples:**
- Trail of Bits
- CertiK
- OpenZeppelin
- Hacken

**Schema Fields:**
```typescript
{
  auditor: "Trail of Bits",
  did: "did:web:defi.example.com",
  auditType: "smart-contract-security",
  passed: true,
  reportUrl: "https://audits.trailofbits.com/report-123.pdf",
  timestamp: 1735689600,
  expiresAt: 1767225600, // Valid for 1 year
  severity: {
    critical: 0,
    high: 0,
    medium: 2,
    low: 5
  }
}
```

### 4. Compliance Attestations

**Purpose:** Prove regulatory or industry compliance

**Examples:**
- GDPR compliant
- SOC2 certified
- HIPAA compliant
- Age rating (ESRB, PEGI)

**Issued by:**
- Compliance auditors
- Industry certification bodies
- Legal firms

### 5. Performance/Uptime Attestations

**Purpose:** Verify SLA compliance, reliability

**Issued by:** Monitoring oracles, independent observers

**Metrics:**
```typescript
{
  did: "did:web:api.example.com",
  uptime: 99.97,
  avgResponseTime: 120, // ms
  period: "30d",
  timestamp: 1735689600
}
```

### 6. User Review Attestations

**Purpose:** Community feedback and ratings

**Issued by:** Verified users

**Structure:**
```typescript
{
  reviewer: "0xUser123...",
  did: "did:web:game.example.com",
  rating: 4.5,
  category: "gameplay",
  comment: "Great graphics, minor bugs",
  timestamp: 1735689600
}
```

**Anti-Sybil:** Reviewers must be verified through:
- Proof of personhood
- On-chain activity history
- Social graph attestations

## Attestation Architecture

### Resolver Contract

**Contract:** `OMA3ResolverWithStore.sol`

**Core Functions:**
```solidity
// Write attestation (issuers only)
function upsertDirect(
  bytes32 didHash,
  bytes32 controllerAddress,
  uint64 expiresAt
) external onlyIssuer

// Check attestation (anyone)
function checkDID(bytes32 didHash, address controller) 
  view returns (bool)
  
function checkDataHashAttestation(bytes32 didHash, bytes32 dataHash)
  view returns (bool)
```

### Issuer Management

**Adding issuers (admin only):**
```bash
npx hardhat resolver-add-issuer \
  --issuer 0xOracleAddress \
  --network omachainTestnet
```

**Removing issuers:**
```bash
npx hardhat resolver-remove-issuer \
  --issuer 0xOracleAddress \
  --network omachainTestnet
```

**Viewing attestations:**
```bash
npx hardhat resolver-view-attestations \
  --did "did:web:example.com" \
  --network omachainTestnet
```

### Maturation Period

**Purpose:** Prevent instant-trust attacks

**Mechanism:**
```solidity
maturationTime: 60 seconds (default, configurable)
```

Attestations don't become "valid" until maturation period passes. This allows time for community review and prevents flash-loan style attacks.

## Using Attestations (Client Perspective)

### Frontend Verification

**Check before displaying:**
```typescript
import { getResolverContract } from '@/lib/contracts/client';
import { readContract } from 'thirdweb';
import { ethers } from 'ethers';

async function verifyService(did: string, ownerAddress: string) {
  const resolver = getResolverContract();
  const didHash = ethers.id(did);
  
  // Check DID ownership
  const ownerVerified = await readContract({
    contract: resolver,
    method: 'function checkDID(bytes32, address) view returns (bool)',
    params: [didHash, ownerAddress]
  });
  
  // Fetch app data
  const app = await registry.getApp(did, 1);
  
  // Check dataHash attestation
  const dataVerified = await readContract({
    contract: resolver,
    method: 'function checkDataHashAttestation(bytes32, bytes32) view returns (bool)',
    params: [didHash, app.dataHash]
  });
  
  return {
    ownerVerified,
    dataVerified,
    trustScore: ownerVerified && dataVerified ? 'HIGH' : 'MEDIUM'
  };
}
```

### Smart Contract Integration

```solidity
import "./OMA3ResolverWithStore.sol";

contract MyContract {
  OMA3ResolverWithStore public resolver;
  
  function verifyServiceBeforeUse(string memory did, address owner) public view returns (bool) {
    bytes32 didHash = keccak256(bytes(did));
    
    // Check ownership attestation
    return resolver.checkDID(didHash, owner);
  }
}
```

### AI Agent Integration

```python
# Python example for AI agents
import web3
from eth_utils import keccak

def verify_api_before_call(did: str, api_url: str):
    resolver = get_resolver_contract()
    did_hash = keccak(text=did)
    
    # Check attestations
    owner_verified = resolver.functions.checkDID(did_hash, expected_owner).call()
    
    if not owner_verified:
        raise Exception(f"API {api_url} failed ownership verification")
    
    # Safe to call API
    return requests.get(api_url)
```

## Issuing Attestations (Auditor Perspective)

### Becoming an Issuer

1. **Request Authorization:**
   - Contact OMA3 governance
   - Provide credentials/reputation
   - Get issuer address approved

2. **Fund Issuer Wallet:**
   - Get testnet OMA tokens from faucet
   - For mainnet: acquire OMA tokens

3. **Issue Attestations:**
```typescript
import { privateKeyToAccount } from 'thirdweb/wallets';
import { prepareContractCall, sendTransaction } from 'thirdweb';

const resolver = getResolverContract();
const issuerAccount = privateKeyToAccount({ privateKey });

const tx = prepareContractCall({
  contract: resolver,
  method: 'function upsertDirect(bytes32, bytes32, uint64)',
  params: [didHash, controllerAddress, expiresAt]
});

const result = await sendTransaction({ transaction: tx, account: issuerAccount });
```

### Best Practices for Issuers

**1. Verify thoroughly before attesting:**
- Don't rubber-stamp - reputation is on the line
- Use automated checks where possible
- Document verification process

**2. Set appropriate expiration:**
- Security audits: 6-12 months
- Uptime attestations: 30 days (renew frequently)
- Compliance: Match certification validity

**3. Revoke if needed:**
- If service is compromised, revoke attestation
- Update expiration to current timestamp

**4. Track gas costs:**
- Each attestation costs gas
- Batch attestations when possible
- Consider sponsorship for high-volume issuance

## Attestation Economics

### Cost Structure

**Issuing attestation:**
- Gas cost: ~50k-100k gas
- At 1 gwei: ~$0.01-0.02 per attestation
- Testnet: Free (faucet tokens)

**Querying attestation:**
- Free (view function)
- No gas cost for clients

### Subsidization (Future)

On OMAchain mainnet, critical trust functions may be subsidized:
- DID ownership verification: Free
- Security audits from approved auditors: Discounted
- User reviews: Gas-sponsored

### Revenue Model (Future)

Potential monetization for issuers:
- Premium attestation services
- Real-time monitoring attestations
- Expedited verification
- Detailed audit reports (off-chain, paid)

## Security Considerations

### Attestation Integrity

**What's cryptographically guaranteed:**
- ✅ Issuer signed the attestation
- ✅ Timestamp is accurate (block time)
- ✅ Attestation hasn't been modified

**What's NOT guaranteed:**
- ❌ Issuer is honest (trust the issuer's reputation)
- ❌ Verification was thorough (depends on issuer)
- ❌ Service hasn't changed since attestation

### Mitigation Strategies

**1. Issuer Reputation:**
- Track issuer history
- Require multiple attestations from different issuers
- Penalize issuers who issue false attestations

**2. Expiration:**
- All attestations should expire
- Force periodic re-verification
- Shorter expiration for high-risk services

**3. Redundancy:**
- Require N-of-M attestations
- Example: 3 out of 5 auditors must attest

**4. Continuous Monitoring:**
- Oracles continuously check services
- Revoke attestations if issues detected
- Real-time status updates

## Common Patterns

### Pattern 1: Initial Registration

```
1. Developer mints app NFT
2. Automated oracle verifies DID ownership
3. Oracle attests dataHash
4. Service is "verified" (basic trust)
```

### Pattern 2: Professional Audit

```
1. Developer requests audit from Trail of Bits
2. Trail of Bits conducts review
3. If passed, Trail of Bits issues attestation
4. Service shows "Audited by Trail of Bits" badge
```

### Pattern 3: Continuous Verification

```
1. Monitoring oracle watches service uptime
2. Every 24 hours, issues fresh uptime attestation
3. Clients see real-time reliability data
4. If downtime exceeds threshold, oracle stops attesting
```

### Pattern 4: Community Reviews

```
1. User tries service, has good experience
2. User (verified via proof-of-personhood) submits review attestation
3. Aggregate score computed from all reviews
4. Service displays: "4.5/5 stars from 127 verified users"
```

## API Reference

### Frontend Verification

**Verify DID ownership:**
```typescript
POST /api/verify-did
Content-Type: application/json

{
  "did": "did:web:example.com",
  "connectedAddress": "0x123..."
}

Response:
{
  "verified": true,
  "attestation": {
    "txHash": "0xabc...",
    "timestamp": 1735689600
  }
}
```

**Verify and attest (combined):**
```typescript
POST /api/verify-and-attest
Content-Type: application/json

{
  "did": "did:web:example.com",
  "connectedAddress": "0x123..."
}

Response:
{
  "verified": true,
  "attested": true,
  "didVerification": { txHash: "0x..." },
  "dataHashAttestation": { txHash: "0x..." }
}
```

### Smart Contract Queries

**Check DID ownership:**
```solidity
function checkDID(bytes32 didHash, address controller) 
  external view returns (bool);
```

**Check dataHash:**
```solidity
function checkDataHashAttestation(bytes32 didHash, bytes32 dataHash) 
  external view returns (bool);
```

**View all attestations for a DID:**
```typescript
// Use hardhat task
npx hardhat resolver-view-attestations \
  --did "did:web:example.com" \
  --network omachainTestnet
```

## Trust Levels

Based on attestations, services can be categorized:

### Level 1: Unverified
- **Attestations:** None
- **Trust:** Minimal
- **Display:** Show warning to users
- **Recommendation:** Proceed with caution

### Level 2: Basic Verification
- **Attestations:** DID ownership
- **Trust:** Basic
- **Display:** "Verified owner"
- **Recommendation:** OK for low-risk interactions

### Level 3: Data Verified
- **Attestations:** DID + dataHash
- **Trust:** Medium
- **Display:** "Verified & data integrity confirmed"
- **Recommendation:** Safe for general use

### Level 4: Audited
- **Attestations:** DID + dataHash + security audit
- **Trust:** High
- **Display:** "Audited by [Firm]"
- **Recommendation:** Safe for financial/sensitive operations

### Level 5: Comprehensive Trust
- **Attestations:** All of the above + compliance + user reviews
- **Trust:** Very High
- **Display:** "Fully verified - 5 attestations"
- **Recommendation:** High confidence for any use

## Attestation Schemas (Future)

OMATrust will adopt EAS (Ethereum Attestation Service) schemas:

### Security Audit Schema
```typescript
{
  auditor: address,
  auditType: string,
  passed: boolean,
  reportIpfsHash: bytes32,
  criticalIssues: uint8,
  highIssues: uint8,
  mediumIssues: uint8,
  lowIssues: uint8,
  auditDate: uint64,
  expiresAt: uint64
}
```

### Uptime Schema
```typescript
{
  oracle: address,
  uptime: uint16,  // basis points (9997 = 99.97%)
  avgResponseTime: uint32, // milliseconds
  periodDays: uint8,
  timestamp: uint64
}
```

### User Review Schema
```typescript
{
  reviewer: address,
  rating: uint8,  // 1-5 stars
  category: string, // "ux", "performance", "support"
  verified: boolean, // proof of personhood
  timestamp: uint64
}
```

## Roadmap

### Current (Testnet)
- ✅ DID ownership attestations
- ✅ DataHash attestations
- ✅ Basic resolver contract
- ✅ Oracle verification via API

### Phase 2 (Q1 2025)
- EAS integration for structured schemas
- Security audit attestations (partner with audit firms)
- Uptime monitoring oracles
- Multi-issuer support

### Phase 3 (Q2 2025)
- User review attestations
- Proof-of-personhood integration
- Aggregated trust scores
- Cross-chain attestation bridging

### Phase 4 (Q3 2025)
- Attestation marketplace
- Reputation staking
- Automated re-attestation
- AI agent verification protocols

## For Developers

**Getting verified:**
1. Register service at [registry.omatrust.org](https://registry.omatrust.org)
2. Automatic DID + dataHash attestations issued
3. Request professional audits (optional)
4. Display attestation badges on your site

**Displaying trust:**
```html
<!-- OMATrust Trust Badge -->
<div class="omatrust-badge" data-did="did:web:example.com">
  <img src="https://cdn.omatrust.org/badges/verified.svg" alt="OMATrust Verified" />
  <span>Verified • 3 Attestations</span>
</div>
```

## For Auditors

**Becoming an issuer:**
1. Build reputation in security community
2. Apply to OMA3 governance
3. Get authorized as issuer
4. Issue attestations via resolver contract

**Revenue opportunities:**
- Charge clients for audits
- Issue attestations as service output
- Build reputation as trusted issuer

## For Users/Clients

**Checking trust before using a service:**

```typescript
// Simple check
const app = await registry.getApp(did, major);
const hasAttestation = await resolver.checkDID(didHash, app.minter);

if (hasAttestation) {
  // ✅ Basic trust established
}

// Comprehensive check
const attestations = await queryAllAttestations(did);
const trustScore = calculateTrustScore(attestations);

if (trustScore > 80) {
  // ✅ High confidence - proceed
} else if (trustScore > 50) {
  // ⚠️ Medium confidence - proceed with caution
} else {
  // ❌ Low confidence - warning to user
}
```

## Best Practices

### For Service Publishers

1. **Get basic attestations early** - DID + dataHash give baseline trust
2. **Invest in audits** - Security attestations significantly boost trust
3. **Maintain compliance** - Keep certifications current
4. **Encourage reviews** - Happy users build reputation
5. **Monitor attestations** - Track expiration, renew proactively

### For Attestation Issuers

1. **Verify thoroughly** - Your reputation depends on accuracy
2. **Set appropriate expiration** - Force re-verification at reasonable intervals
3. **Document process** - Transparency builds trust in your attestations
4. **Respond to disputes** - Have process for reviewing challenged attestations
5. **Track performance** - Monitor false positive/negative rates

### For Client Applications

1. **Check multiple attestations** - Don't rely on single source
2. **Respect maturation** - Wait for attestations to mature
3. **Cache verification results** - Avoid redundant on-chain queries
4. **Fallback gracefully** - Handle services without attestations
5. **Educate users** - Explain what attestations mean

## Next Steps

- **[Registration Guide](./registration-guide.md)** - Register and get attested
- **[Client Guide](./client-guide.md)** - Query attestations
- **[Auditor Guide](./auditor-guide.md)** - Issue attestations

---

**Questions about attestations?** Visit [reputation.oma3.org](https://reputation.oma3.org) or join the OMA3 Discord.


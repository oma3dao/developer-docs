---
title: Attestation Framework
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
- "SecureAudit Pro verifies that did:web:defi.example.com passed security audit on 2025-01-15"
- "Oracle verifies that did:web:api.example.com owns the domain"
- "User Alice gives did:web:game.example.com a 5-star rating"
```

**Properties:**
- **Immutable** - Can't be changed after issuance
- **Timestamped** - Includes issuance date
- **Cryptographically Signed** - Issuer's signature proves authenticity
- **On-Chain** - Publicly queryable and verifiable

## Types of Attestations

OMATrust supports two different attestation architectures:

1. **AppRegistry Resolver Contract Attestations** - Basic attestations stored directly in the resolver contract
2. **EAS Framework Attestations** - Structured attestations using the Ethereum Attestation Service

### AppRegistry Resolver Contract Attestations

### 1. DID Ownership Attestations

**Purpose:** Prove the service owner controls the DID

**Issued by:** OMATrust issuer (automated)

**Schemas:**
- `OMA3/DIDOwnership` - General DID control
- `OMA3/DomainOwnership` - Specific to did:web
- `OMA3/ContractOwnership` - Specific to did:pkh

**Verification Methods:**

**For did:web:**
```
1. Fetch https://example.com/.well-known/did.json
   OR check DNS TXT record at _omatrust.example.com
2. Check if wallet address in DID document or DNS TXT record
   DNS format: v=1;controller=<DID>
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

**Architecture:** AppRegistry Resolver Contract

**Purpose:** Verify the integrity of metadata at dataUrl

**Issued by:** OMATrust issuer (automated on registration)

**Flow:**
```typescript
// 1. App registers with dataUrl
dataUrl: "https://api.example.com/metadata.json"
dataHash: "0xabc123..." (keccak256 of JCS-canonicalized JSON)

// 2. Issuer fetches and verifies
const fetched = await fetch(dataUrl);
const canonicalized = canonicalizeJson(fetched); // JCS (RFC 8785)
const computed = keccak256(canonicalized);

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
  // ✅ Issuer confirmed the hash
}
```

**Important:** JSON must be canonicalized using JCS (JSON Canonicalization Scheme, RFC 8785) before hashing. See the [Identity Specification](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-identity.md) for details.

### 3. Security Audit Attestations

**Architecture:** EAS Framework

**Purpose:** Prove a service passed professional security review

**Issued by:** Security firms, auditing companies

**Schema Fields:**
```typescript
{
  auditor: "SecureAudit Pro",
  did: "did:web:defi.example.com",
  auditType: "smart-contract-security",
  passed: true,
  reportUrl: "https://audits.secureauditpro.com/report-123.pdf",
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

### 4. User Review Attestations

**Architecture:** EAS Framework

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
  timestamp: 1735689600,
  proofs: [] // Optional proof array for verification
}
```

**Proofs in Attestations:** Attestations can include cryptographic proofs for additional verification. See the [Proof Specification](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-proofs.md) for details on proof types and verification mechanisms.



### EAS Framework Attestations

The following attestation types are implemented using the EAS framework with structured schemas:

#### Certification Attestations

**Purpose:** Prove regulatory or industry compliance

**Architecture:** EAS Framework  
**Schema:** Certification schema

**Examples:**
- GDPR compliant
- SOC2 certified
- HIPAA compliant
- Age rating (ESRB, PEGI)

**Issued by:**
- Compliance auditors
- Industry certification bodies
- Legal firms

**Note:** Certification attestations replace the older "Compliance Attestations" terminology.

#### Endorsement Attestations

**Purpose:** Lightweight attestations indicating support, trust, or approval

**Architecture:** EAS Framework  
**Schema:** Endorsement schema

**Use Cases:**
- Organization endorsements
- Trust signals
- Approval attestations

#### Security Assessment Attestations

**Purpose:** Prove a service passed professional security review

**Architecture:** EAS Framework  
**Schema:** Security Assessment schema

**Issued by:** Security firms, auditing companies

**Examples:**
- SecureAudit Pro
- CertiK
- OpenZeppelin
- Hacken

**Schema Fields:**
```typescript
{
  auditor: "SecureAudit Pro",
  did: "did:web:defi.example.com",
  auditType: "smart-contract-security",
  passed: true,
  reportUrl: "https://audits.secureauditpro.com/report-123.pdf",
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

**Note:** Performance and uptime attestations are not currently supported in the EAS framework.

## Attestation Architecture

OMATrust uses two different attestation architectures:

### 1. Resolver Contract

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
  --issuer 0xIssuerAddress \
  --network omachainTestnet
```

**Removing issuers:**
```bash
npx hardhat resolver-remove-issuer \
  --issuer 0xIssuerAddress \
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



### 2. EAS Framework

**Contracts:** `EAS.sol`, `SchemaRegistry.sol`  
**Purpose:** Structured attestations with custom schemas

**Core Functions:**
```solidity
// Register schema
function register(string calldata schema) external returns (bytes32)

// Issue attestation
function attest(
  bytes32 schema,
  address recipient,
  uint64 expirationTime,
  bool revocable,
  bytes32 refUID,
  bytes calldata data
) external payable returns (bytes32)
```

**Schema-Based Attestations:**
- Certification schema - For compliance and certification attestations
- Endorsement schema - For trust and approval attestations  
- Security Assessment schema - For security audit attestations

**Key Features:**
- Structured data via JSON schemas
- Revocable attestations (when configured)
- Cross-chain support
- Standardized query interface

**Querying EAS Attestations:**
```typescript
import { EAS } from '@ethereum-attestation-service/eas-sdk';

const eas = new EAS(easContractAddress);
const attestation = await eas.getAttestation(attestationUID);
```

**Challenge Mechanism:** The resolver supports challenges to disputed attestations. Multiple issuers can attest to the same DID, and conflicts are resolved through a challenge process with maturation delays. See the [Identity Specification](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-identity.md) for complete details on conflict resolution.

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
1. Developer requests audit from SecureAudit Pro
2. SecureAudit Pro conducts review
3. If passed, SecureAudit Pro issues attestation
4. Service shows "Audited by SecureAudit Pro" badge
```

### Pattern 3: Community Reviews

```
1. User tries service, has good experience
2. User (verified via proof-of-personhood) submits review attestation
3. Aggregate score computed from all reviews
4. Service displays: "4.5/5 stars from 127 verified users"
```

## API Reference

### Frontend Verification

**Verify and attest (unified endpoint):**
```typescript
POST /api/verify-and-attest
Content-Type: application/json

{
  "did": "did:web:example.com",
  "connectedAddress": "0x123...",
  "requiredSchemas": ["oma3.ownership.v1"]
}

Response:
{
  "ok": true,
  "status": "ready",
  "attestations": {
    "present": ["oma3.ownership.v1"],
    "missing": []
  },
  "txHashes": ["0xabc..."],
  "elapsed": "1234ms"
}
```

This endpoint is idempotent - it checks for existing attestations first (fast path), only verifying and writing new attestations if needed.

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

OMATrust uses EAS (Ethereum Attestation Service) schemas for structured attestations. For complete schema definitions, see the [Reputation Specification](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-reputation.md).

### Security Audit Schema (Example)
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

### User Review Schema (Example)
```typescript
{
  reviewer: address,
  rating: uint8,  // 1-5 stars
  category: string, // "ux", "performance", "support"
  verified: boolean, // proof of personhood
  timestamp: uint64,
  proofs: [] // Optional cryptographic proofs
}
```

For complete attestation schemas and proof integration, refer to the [Reputation Specification](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-reputation.md).

## Roadmap

### Current (Testnet)
- ✅ DID ownership attestations
- ✅ DataHash attestations
- ✅ Basic resolver contract
- ✅ Oracle verification via API

### Phase 2 (Q1 2025)
- EAS integration for structured schemas
- Security audit attestations (partner with audit firms)
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

- **[Registration Guide](/app-registry/registration-guide)** - Register and get attested
- **[Client Guide](/reputation/consumer-workflow)** - Query attestations
- **[Auditor Guide](/reputation/issuer-workflow)** - Issue attestations

---

**Questions about attestations?** Visit [reputation.oma3.org](https://reputation.oma3.org) or email support@oma3.org.


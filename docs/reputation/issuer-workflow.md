---
title: Auditor & Oracle Guide
---

# Auditor & Oracle Guide

:::caution Draft Documentation
Attestation issuer processes and authorization are evolving. Contact governance@oma3.org for current requirements and application process.
:::

Learn how to become an attestation issuer and provide trust services in the OMATrust ecosystem.

## Who Can Issue Attestations?

**Potential issuers:**
- Security audit firms (Trail of Bits, CertiK, OpenZeppelin, etc.)
- Compliance certifiers (SOC2, GDPR, HIPAA auditors)
- Monitoring oracles (uptime, performance tracking)
- Community moderators (curated lists, quality checks)
- Automated oracles (OMATrust's own verification system)

## Becoming an Authorized Issuer

### Step 1: Build Reputation

**Prerequisites:**
- Established track record in your domain
- Verifiable credentials or certifications
- References from previous clients
- Public portfolio or case studies

**For security auditors:**
- Past audit reports (with client permission)
- CVE discoveries
- Open source contributions
- Industry certifications (OSCP, CEH, etc.)

**For monitoring oracles:**
- Uptime history
- API reliability
- Transparent methodology

### Step 2: Apply to OMA3 Governance

**Submit application:**
```
Email: governance@oma3.org
Subject: Attestation Issuer Application

Include:
- Organization name
- Type of attestations you'll issue
- Verification methodology
- Reputation/credentials
- Wallet address for issuer authorization
- Proposed fee structure (if any)
```

**Evaluation criteria:**
- Track record and reputation
- Methodology transparency
- Economic sustainability
- Ecosystem alignment

### Step 3: Get Authorized

**OMA3 admin authorizes your issuer address:**

```bash
npx hardhat resolver-add-issuer \
  --issuer 0xYourIssuerAddress \
  --network omachainTestnet
```

**You'll receive:**
- Issuer authorization on resolver contract
- Access to attestation infrastructure
- Documentation and best practices
- Initial testnet OMA tokens

## Issuing Attestations

### Setup

**Install dependencies:**
```bash
npm install thirdweb ethers dotenv
```

**Create environment:**
```bash
# .env
ISSUER_PRIVATE_KEY=0x...
THIRDWEB_CLIENT_ID=...
```

**Or use Thirdweb Managed Vault (production):**
```bash
THIRDWEB_SECRET_KEY=...
THIRDWEB_SERVER_WALLET_ADDRESS=0x...
```

### Issue DID Ownership Attestation

```typescript
import { getResolverContract } from './contracts';
import { prepareContractCall, sendTransaction } from 'thirdweb';
import { privateKeyToAccount } from 'thirdweb/wallets';
import { ethers } from 'ethers';

async function attestDIDOwnership(
  did: string,
  ownerAddress: string,
  validityPeriod: number = 31536000 // 1 year in seconds
) {
  // 1. Verify ownership (your methodology)
  const verified = await verifyOwnership(did, ownerAddress);
  if (!verified) {
    throw new Error('Ownership verification failed');
  }
  
  // 2. Prepare attestation
  const resolver = getResolverContract();
  const didHash = ethers.id(did);
  const controllerAddress = ethers.zeroPadValue(ownerAddress, 32);
  const expiresAt = Math.floor(Date.now() / 1000) + validityPeriod;
  
  // 3. Sign and submit
  const issuerAccount = privateKeyToAccount({
    privateKey: process.env.ISSUER_PRIVATE_KEY
  });
  
  const tx = prepareContractCall({
    contract: resolver,
    method: 'function upsertDirect(bytes32, bytes32, uint64)',
    params: [didHash, controllerAddress, expiresAt]
  });
  
  const result = await sendTransaction({ transaction: tx, account: issuerAccount });
  
  console.log(`Attestation issued: ${result.transactionHash}`);
  return result;
}
```

### Issue DataHash Attestation

```typescript
async function attestDataHash(did: string, dataUrl: string, expectedHash: string) {
  // 1. Fetch data from dataUrl
  const response = await fetch(dataUrl);
  const jsonText = await response.text();
  
  // 2. Compute hash
  const computedHash = ethers.id(jsonText); // keccak256
  
  // 3. Verify hash matches
  if (computedHash.toLowerCase() !== expectedHash.toLowerCase()) {
    throw new Error(`Hash mismatch: expected ${expectedHash}, got ${computedHash}`);
  }
  
  // 4. Issue attestation
  const resolver = getResolverContract();
  const didHash = ethers.id(did);
  
  const tx = prepareContractCall({
    contract: resolver,
    method: 'function attestDataHash(bytes32, bytes32)',
    params: [didHash, expectedHash]
  });
  
  const issuerAccount = privateKeyToAccount({ privateKey: process.env.ISSUER_PRIVATE_KEY });
  const result = await sendTransaction({ transaction: tx, account: issuerAccount });
  
  return result;
}
```

## Verification Methodologies

### DID:Web Verification

```typescript
async function verifyDidWeb(did: string, claimedOwner: string): Promise<boolean> {
  // Extract domain from DID
  const domain = did.replace('did:web:', '');
  
  try {
    // Fetch DID document
    const didDoc = await fetch(`https://${domain}/.well-known/did.json`)
      .then(r => r.json());
    
    // Check if claimedOwner in verificationMethod
    const found = didDoc.verificationMethod?.some((method: any) => {
      const accountId = method.blockchainAccountId; // Format: eip155:1:0xAddress
      const address = accountId?.split(':')[2];
      return address?.toLowerCase() === claimedOwner.toLowerCase();
    });
    
    return found || false;
  } catch (error) {
    console.error('DID verification failed:', error);
    return false;
  }
}
```

### DID:PKH Verification

```typescript
async function verifyDidPkh(did: string, claimedOwner: string): Promise<boolean> {
  // Parse DID: did:pkh:eip155:1:0xContractAddress
  const parts = did.split(':');
  const chainId = parseInt(parts[3]);
  const contractAddress = parts[4];
  
  // Get RPC for chain
  const rpc = getRpcForChain(chainId);
  const provider = new ethers.JsonRpcProvider(rpc);
  
  // Create contract instance
  const contract = new ethers.Contract(
    contractAddress,
    ['function owner() view returns (address)'],
    provider
  );
  
  try {
    const owner = await contract.owner();
    return owner.toLowerCase() === claimedOwner.toLowerCase();
  } catch {
    // Try admin() if owner() fails
    try {
      const adminContract = new ethers.Contract(
        contractAddress,
        ['function admin() view returns (address)'],
        provider
      );
      const admin = await adminContract.admin();
      return admin.toLowerCase() === claimedOwner.toLowerCase();
    } catch {
      return false;
    }
  }
}
```

## Batch Attestations

### Attest Multiple Services

```typescript
async function batchAttest(services: Array<{did: string, owner: string}>) {
  for (const service of services) {
    try {
      // Verify
      const verified = await verifyOwnership(service.did, service.owner);
      
      if (verified) {
        // Attest
        await attestDIDOwnership(service.did, service.owner);
        console.log(`✅ Attested: ${service.did}`);
      } else {
        console.log(`❌ Failed verification: ${service.did}`);
      }
      
      // Rate limit
      await sleep(1000); // 1 second between attestations
    } catch (error) {
      console.error(`Error attesting ${service.did}:`, error.message);
    }
  }
}
```

## Monitoring & Automation

### Automated Oracle

```typescript
// Continuously monitor and re-attest
class AutomatedOracle {
  async monitorAndAttest(did: string, checkInterval: number = 86400000) {
    setInterval(async () => {
      try {
        // Get service
        const service = await getService(did, 1);
        
        // Verify still owned by minter
        const stillOwned = await verifyOwnership(did, service.minter);
        
        if (!stillOwned) {
          console.warn(`Owner changed for ${did} - revoking attestation`);
          await revokeAttestation(did);
          return;
        }
        
        // Verify dataUrl still matches hash
        const dataIntact = await verifyDataIntegrity(service);
        
        if (!dataIntact.valid) {
          console.warn(`Data tampered for ${did} - revoking`);
          await revokeAttestation(did);
          return;
        }
        
        // Re-attest if expiring soon
        const expiresAt = await getAttestationExpiry(did);
        const daysUntilExpiry = (expiresAt - Date.now()) / 86400000;
        
        if (daysUntilExpiry < 7) {
          await attestDIDOwnership(did, service.minter);
          console.log(`Renewed attestation for ${did}`);
        }
      } catch (error) {
        console.error(`Monitoring failed for ${did}:`, error);
      }
    }, checkInterval);
  }
}

// Start monitoring
const oracle = new AutomatedOracle();
oracle.monitorAndAttest('did:web:critical-api.example.com');
```

### Uptime Monitoring

```typescript
async function monitorUptime(did: string) {
  const service = await getService(did, 1);
  const metadata = await fetchMetadata(service.dataUrl);
  
  const endpoint = metadata.endpoints?.[0]?.endpoint || metadata.platforms?.web?.launchUrl;
  
  // Ping every minute
  const uptimeTracker = {
    total: 0,
    successful: 0
  };
  
  setInterval(async () => {
    uptimeTracker.total++;
    
    try {
      const response = await fetch(endpoint, { method: 'HEAD', timeout: 5000 });
      if (response.ok) {
        uptimeTracker.successful++;
      }
    } catch {
      // Failed - don't increment successful
    }
    
    // Every hour, issue uptime attestation
    if (uptimeTracker.total % 60 === 0) {
      const uptime = (uptimeTracker.successful / uptimeTracker.total) * 100;
      
      if (uptime >= 99.5) {
        await issueUptimeAttestation(did, uptime);
      }
    }
  }, 60000); // 1 minute
}
```

## Economic Model

### Issuer Revenue

**Potential income streams:**

1. **Service Fees:**
   - Security audits: $10k-$50k per contract
   - Compliance certifications: $5k-$20k annually
   - Performance monitoring: $100-$1000/month

2. **Attestation Fees:**
   - Charge for issuing attestations
   - Subscription for continuous monitoring
   - Premium: expedited verification

3. **Data Licensing:**
   - Sell aggregated trust data
   - API access to attestation database
   - Analytics and insights

### Cost Structure

**Gas costs:**
- Attestation: ~50k-100k gas
- At 1 gwei: ~$0.01-0.02 per attestation
- Subsidized on OMAchain (future)

**Operational costs:**
- Infrastructure (monitoring, APIs)
- Staff (auditors, reviewers)
- Insurance (errors & omissions)

## Best Practices

### 1. Methodology Transparency

**Document your process:**
```markdown
# Our Verification Methodology

## DID:Web Verification
1. Fetch DID document from domain
2. Validate JSON-LD structure
3. Check wallet address in verificationMethod
4. Verify SSL certificate validity
5. Check domain registration age (>90 days preferred)

## DataHash Verification
1. Fetch JSON from dataUrl
2. Compute keccak256 hash
3. Compare with on-chain hash
4. Verify content hasn't changed in 24 hours
5. Issue attestation if stable
```

### 2. Consistent Standards

**Use same criteria for all:**
- Don't favor certain clients
- Document exceptions
- Publish rejection criteria
- Be transparent about limitations

### 3. Timely Updates

**Expiration management:**
- Set appropriate expiration dates
- Renew before expiry
- Revoke if issues detected
- Notify affected parties

### 4. Dispute Resolution

**Handle challenges:**
```typescript
interface DisputeProcess {
  report: (did: string, issue: string) => Promise<void>;
  investigate: (disputeId: string) => Promise<InvestigationResult>;
  resolve: (disputeId: string, resolution: Resolution) => Promise<void>;
}

// Example
async function handleDispute(did: string, issue: string) {
  // 1. Suspend attestation pending investigation
  await suspendAttestation(did);
  
  // 2. Investigate
  const finding = await investigate(did, issue);
  
  // 3. Resolve
  if (finding.valid) {
    await restoreAttestation(did);
  } else {
    await revokeAttestation(did);
  }
  
  // 4. Publish resolution
  await publishResolution(did, finding);
}
```

## Tools & Infrastructure

### Attestation Dashboard

```typescript
// Monitor your issued attestations
async function getIssuerDashboard(issuerAddress: string) {
  const attestations = await queryAttestationsByIssuer(issuerAddress);
  
  return {
    total: attestations.length,
    active: attestations.filter(a => !a.expired).length,
    expiringSoon: attestations.filter(a => 
      a.expiresAt - Date.now() < 7 * 86400000
    ).length,
    revoked: attestations.filter(a => a.revoked).length,
    
    byType: groupBy(attestations, 'type'),
    recentActivity: attestations.slice(0, 10)
  };
}
```

### Automated Verification Pipeline

```typescript
class VerificationPipeline {
  async processQueue() {
    const pending = await this.getPendingVerifications();
    
    for (const request of pending) {
      try {
        // Run verification checks
        const result = await this.verify(request);
        
        if (result.passed) {
          // Issue attestation
          await this.attest(request.did, request.owner);
          await this.notifyRequester(request, 'approved');
        } else {
          // Reject
          await this.notifyRequester(request, 'rejected', result.reason);
        }
      } catch (error) {
        await this.logError(request, error);
      }
    }
  }
  
  async verify(request: VerificationRequest) {
    // Your verification logic
    const checks = [
      this.checkDIDDocument(request.did),
      this.checkDomainAge(request.did),
      this.checkSSLCertificate(request.did),
      this.checkNoMaliciousHistory(request.owner)
    ];
    
    const results = await Promise.all(checks);
    const passed = results.every(r => r.success);
    
    return {
      passed,
      reason: passed ? null : results.find(r => !r.success)?.reason,
      checks: results
    };
  }
}
```

## Revenue Examples

### Security Audit Firm

**Attestation service:**
```
Base audit: $15,000
└─ Includes:
   - Code review
   - Penetration testing
   - Report delivery
   - On-chain attestation issuance
   - 1 year validity

Premium audit: $30,000
└─ Includes all above plus:
   - Continuous monitoring
   - Monthly re-attestation
   - Priority support
   - Public report publication
```

**Annual revenue (50 audits):**
- Audits: $750k - $1.5M
- Monitoring subscriptions: $100k
- Total: $850k - $1.6M

### Uptime Oracle

**Pricing:**
```
Free tier:
- Hourly checks
- 30-day attestations
- Public data only

Pro tier: $50/month
- Minute-by-minute checks
- Real-time attestations
- Private dashboards
- SLA guarantees

Enterprise: $500/month
- Second-by-second monitoring
- Multi-region checks
- Custom attestation schemas
- Dedicated support
```

**Annual revenue (100 pro + 10 enterprise customers):**
- Pro: $60k
- Enterprise: $60k
- Total: $120k

### Compliance Certifier

**Services:**
```
GDPR Compliance: $8,000
└─ Assessment, attestation, annual renewal

SOC2 Type II: $15,000
└─ Full audit, attestation, quarterly reviews

HIPAA Compliance: $12,000
└─ Healthcare-specific review, attestation
```

## Liability & Insurance

### Errors & Omissions Insurance

**Coverage needed:**
- False positive attestations (attesting insecure service)
- False negative attestations (rejecting legitimate service)
- Methodology errors
- Infrastructure failures

**Typical coverage:** $1M-$5M per incident

### Risk Mitigation

```typescript
// Document every verification
interface VerificationRecord {
  did: string;
  timestamp: number;
  methodology: string;
  checksPerformed: string[];
  evidence: any[];
  auditor: string;
  result: 'passed' | 'failed';
  reason?: string;
}

async function documentVerification(did: string, result: any) {
  const record: VerificationRecord = {
    did,
    timestamp: Date.now(),
    methodology: 'DIDWebVerificationV1',
    checksPerformed: [
      'DID document fetch',
      'Wallet address verification',
      'SSL certificate check',
      'Domain age check'
    ],
    evidence: [
      { type: 'did-document', data: result.didDoc },
      { type: 'ssl-cert', data: result.sslCert },
      { type: 'whois', data: result.whois }
    ],
    auditor: process.env.ISSUER_ADDRESS,
    result: result.passed ? 'passed' : 'failed',
    reason: result.reason
  };
  
  // Store permanently
  await database.saveVerificationRecord(record);
  
  // Optional: Store IPFS hash on-chain for tamper-resistance
  const recordHash = await uploadToIPFS(record);
  await logVerificationHash(did, recordHash);
}
```

## Governance & Updates

### Methodology Updates

**When changing verification process:**
```
1. Publish updated methodology
2. Version it (v1 → v2)
3. Notify OMA3 governance
4. Re-verify existing attestations if needed
5. Update documentation
```

### Issuer Status

**Maintaining good standing:**
- Respond to disputes within 48 hours
- Maintain less than 1% false positive rate
- Keep attestations current (renew before expiry)
- Participate in governance discussions
- Transparent operations

**Removal conditions:**
- Repeated false attestations
- Failure to handle disputes
- Malicious behavior
- Inactivity (>6 months)

## Next Steps

- **[Client Guide](/reputation/consumer-workflow)** - Query attestations you issued
- **[Cookbooks](/app-registry/cookbooks/register-website)** - Understand what you're attesting
- **[Attestations Framework](/reputation/attestation-types)** - Technical details

---

**Ready to become an attestation issuer?** Contact governance@oma3.org to apply.


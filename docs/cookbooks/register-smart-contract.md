---
id: register-smart-contract
title: Register Smart Contract
sidebar_position: 5
---

# Cookbook: Register a Smart Contract

:::caution Draft Documentation
Smart contract registration process is subject to change. did:pkh verification methods may expand. Test thoroughly on testnet first.
:::

Register your smart contract in OMATrust to establish provenance, link to audits, and enable cross-chain trust verification.

## Use Cases

- **DeFi protocols** - Link to security audits
- **NFT contracts** - Establish authenticity
- **DAO governance** - Verify contract legitimacy
- **Token contracts** - Build trust for new tokens
- **Cross-chain bridges** - Coordinate identity across chains

## Prerequisites

- Deployed smart contract
- Wallet that controls the contract (owner/admin)
- Web3 wallet with testnet OMA tokens
- (Optional) Security audit report

## DID Format for Contracts

Smart contracts use `did:pkh` (Public Key Hash) format:

**Format:** `did:pkh:<namespace>:<chainId>:<contractAddress>`

**Examples:**
```
Ethereum Mainnet:  did:pkh:eip155:1:0x1234567890abcdef1234567890abcdef12345678
Optimism:          did:pkh:eip155:10:0x1234567890abcdef1234567890abcdef12345678
Base:              did:pkh:eip155:8453:0x1234567890abcdef1234567890abcdef12345678
OMAchain Testnet:  did:pkh:eip155:66238:0x1234567890abcdef1234567890abcdef12345678
```

**Components:**
- `eip155` - Namespace (EVM chains)
- Chain ID - Network identifier
- Contract address - Your contract

## Registration Walkthrough

### Step 1: Verify Contract Ownership

**Requirements:**
- Your wallet must be the contract owner/admin
- Contract must have `owner()` or `admin()` function

**Verification:**
```solidity
// Your contract should have:
function owner() public view returns (address) {
    return _owner;
}

// Or
function admin() public view returns (address) {
    return _admin;
}
```

### Step 2: Register via Wizard

**Step 1 - Verification:**
- Name: "MyToken Contract"
- Version: "1.0.0"
- DID Type: `did:pkh`
- DID: `did:pkh:eip155:1:0xYourContractAddress`
  - The wizard helps construct this from:
    - Chain ID: 1 (Ethereum)
    - Contract Address: 0x...
- Interfaces: ☑ Smart Contract
- Click "Verify DID Ownership"

**Verification process:**
1. Issuer extracts chain ID and address from DID
2. Calls `contract.owner()` or `contract.admin()`
3. Verifies it matches your connected wallet
4. Issues attestation
5. Shows "✅ Verified"

**Step 2 - On-Chain:**
- Contract ID: `eip155:1:0xYourContractAddress` (CAIP-10 format, auto-filled from DID)
- Traits: `defi`, `token`, `erc20` (or `erc721`, `erc1155`)

**Step 3 - Common:**
- Description: "Governance token for Example DAO with staking and voting mechanisms"
- Publisher: "Example DAO"
- External URL: `https://example.com/token`
- Support URL: `https://docs.example.com`

**Step 7 - Endpoint (Optional):**
- RPC Endpoint: `https://eth-mainnet.g.alchemy.com/v2/your-key` (optional - recommend best RPC)
- Schema URL: `https://etherscan.io/address/0xYourContract#code` (link to verified source)

**Step 6 - Review & Submit:**
- Verify all fields
- Submit transaction
- Done!

### Step 3: Link to Audit Report

After registration, add audit attestation:

**If you have an audit:**
1. Visit [reputation.oma3.org](https://reputation.oma3.org)
2. Submit audit report
3. Auditor reviews and issues attestation
4. Attestation linked to your contract DID

**Or programmatically:**
```bash
# Auditor issues attestation
npx hardhat resolver-add-issuer \
  --issuer 0xAuditorAddress \
  --network omachainTestnet

# Auditor attests
npx hardhat resolver-attest-dataurl \
  --did "did:pkh:eip155:1:0xYourContract" \
  --hash 0xAuditReportHash \
  --network omachainTestnet
```

## Example: ERC-20 Token

### Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ExampleToken is ERC20, Ownable {
    constructor() ERC20("Example Token", "EXT") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }
    
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
```

### Registration

**DID:** `did:pkh:eip155:1:0xContractAddress`

**Metadata:**
```json
{
  "name": "Example Token (EXT)",
  "description": "Governance and utility token for Example DAO. Used for voting, staking, and accessing premium features.",
  "image": "https://example.com/token-logo.png",
  "publisher": "Example DAO",
  "external_url": "https://example.com/token",
  "supportUrl": "https://docs.example.com/token",
  "legalUrl": "https://example.com/token/legal",
  "traits": ["defi", "governance", "erc20", "staking"]
}
```

**Contract ID:** `eip155:1:0xContractAddress` (CAIP-10)

**Traits:** `defi`, `governance`, `erc20`, `staking`

## Example: NFT Collection

### Registration

**DID:** `did:pkh:eip155:1:0xNFTContractAddress`

**Metadata:**
```json
{
  "name": "Awesome NFT Collection",
  "description": "10,000 unique NFTs with on-chain traits and utility",
  "image": "https://nft.example.com/collection-logo.png",
  "publisher": "NFT Studio",
  "external_url": "https://nft.example.com",
  "screenshotUrls": [
    "https://nft.example.com/preview-1.png",
    "https://nft.example.com/preview-2.png"
  ],
  "traits": ["nft", "erc721", "art", "gaming", "verified"]
}
```

**With both interfaces:**
- Interfaces: ☑ Human ☑ Smart Contract
- Human: Screenshots, website
- Contract: On-chain verification

## Example: DeFi Protocol

### Multi-Contract Registration

**Separate registration for each contract:**

**1. Main protocol contract:**
```
DID: did:pkh:eip155:1:0xProtocolAddress
Traits: defi, lending, protocol
```

**2. Governance token:**
```
DID: did:pkh:eip155:1:0xTokenAddress
Traits: defi, governance, erc20
Contract ID: eip155:1:0xTokenAddress
```

**3. Staking contract:**
```
DID: did:pkh:eip155:1:0xStakingAddress
Traits: defi, staking, yield
Contract ID: eip155:1:0xStakingAddress
```

**Link them via fungibleTokenId:**
- Protocol references token via `fungibleTokenId: eip155:1/erc20:0xTokenAddress`

## Audit Integration

### Pre-Audit Registration

**Before audit:**
```
Status: Active
Traits: defi, unaudited
Description: "⚠️ Unaudited - use at your own risk"
```

### Post-Audit Update

**After audit passes:**
```
1. Update metadata:
   - Description: "Audited by Trail of Bits - No critical issues"
   - Add trait: audit:trail-of-bits
2. Link audit report in supportUrl
3. Request attestation from auditor
```

**Auditor issues attestation:**
```typescript
// Auditor (Trail of Bits) attests
await resolver.upsertDirect(
  didHash,
  controllerAddress,
  expiresAt // 1 year from now
);
```

**Clients see:**
```
✅ Verified Owner
🛡️ Audited by Trail of Bits
Trust Score: 95/100
```

## Cross-Chain Deployment

### Same Contract on Multiple Chains

**Ethereum Mainnet:**
```
DID: did:pkh:eip155:1:0x1234...
Name: "Example Token (Ethereum)"
```

**Optimism:**
```
DID: did:pkh:eip155:10:0x1234... (same address)
Name: "Example Token (Optimism)"
```

**Coordination (Future):**
- OMAchain deduplicator recognizes same contract
- Links cross-chain deployments
- Attestations can reference canonical version

## Contract Upgrades

### Proxy Pattern

**For upgradeable contracts:**

**Initial deployment:**
```
DID: did:pkh:eip155:1:0xProxyAddress
Version: 1.0.0
Description: "Using TransparentUpgradeableProxy pattern"
```

**After upgrade:**
```
Version: 2.0.0 (new major version)
Description: "Upgraded implementation - breaking changes"
versionHistory: [1.0.0, 2.0.0]
Status: v1.0.0 marked as "Replaced"
```

### Immutable Contracts

**For non-upgradeable:**

**Version 1:**
```
DID: did:pkh:eip155:1:0xV1Address
Version: 1.0.0
Status: Replaced
```

**Version 2 (new deployment):**
```
DID: did:pkh:eip155:1:0xV2Address
Version: 2.0.0
Status: Active
Traits: Include "migration:0xV1Address"
```

## Security Disclosure

### Vulnerability Found

**If security issue discovered:**

```
1. Mark status as "Deprecated" immediately
2. Update description: "⚠️ Security vulnerability disclosed - do not use"
3. Deploy fixed version
4. Register fixed version
5. Communicate to users
```

**Metadata update:**
```json
{
  "status": 1, // Deprecated
  "description": "DEPRECATED: Security vulnerability CVE-2025-1234. Use v2.0 instead.",
  "external_url": "https://example.com/security-advisory"
}
```

## Verification for Users

### Check Contract Before Use

```typescript
async function safeContractInteraction(contractAddress: string) {
  // 1. Check if registered in OMATrust
  const did = `did:pkh:eip155:1:${contractAddress}`;
  
  let service;
  try {
    service = await getService(did, 1);
  } catch {
    console.warn('Contract not registered in OMATrust');
    return { registered: false, safe: false };
  }
  
  // 2. Check status
  if (service.status !== 0) {
    console.warn('Contract deprecated or replaced');
    return { registered: true, safe: false, reason: 'deprecated' };
  }
  
  // 3. Check attestations
  const attestations = await checkAttestations(did, service.minter, service.dataHash);
  
  // 4. Look for audit attestations (future)
  const hasAudit = service.traits?.some(t => t.startsWith('audit:'));
  
  return {
    registered: true,
    safe: attestations.ownerVerified && hasAudit,
    attestations,
    hasAudit,
    trustScore: calculateTrustScore({ attestations, hasAudit })
  };
}

// Usage
const safety = await safeContractInteraction('0x123...');
if (safety.trustScore < 70) {
  alert('Warning: Contract has low trust score');
}
```

## Contract Metadata Standards

### Token Contract

```json
{
  "name": "Example Token",
  "symbol": "EXT",
  "decimals": 18,
  "totalSupply": "1000000",
  "contractStandard": "ERC-20",
  "description": "Governance token for Example DAO",
  "traits": ["defi", "governance", "erc20"]
}
```

### NFT Contract

```json
{
  "name": "Awesome NFTs",
  "symbol": "ANFT",
  "totalSupply": 10000,
  "contractStandard": "ERC-721",
  "description": "NFT collection with on-chain traits",
  "traits": ["nft", "erc721", "art", "generative"]
}
```

### DeFi Protocol

```json
{
  "name": "Lending Protocol",
  "description": "Decentralized lending and borrowing protocol",
  "contractStandard": "Custom",
  "version": "2.0.0",
  "audits": [
    {
      "auditor": "Trail of Bits",
      "date": "2025-01-15",
      "reportUrl": "https://audits.example.com/report.pdf"
    }
  ],
  "traits": ["defi", "lending", "audited"]
}
```

## Next Steps

- **[Auditor Guide](../auditor-guide.md)** - Get your contract audited
- **[Client Guide](../client-guide.md)** - Verify contracts before use
- **[Register Website](./register-website.md)** - Frontend for your dApp

---

**Have a smart contract to register?** Get started at [registry.omatrust.org](https://registry.omatrust.org)!


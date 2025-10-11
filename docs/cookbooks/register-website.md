---
id: register-website
title: Register a Website
sidebar_position: 1
---

# Cookbook: Register a Website

:::caution Draft Documentation
This cookbook reflects current testnet implementation. Steps and UI may change. Test on testnet before production use.
:::

Register your website in OMATrust to establish verifiable identity and build trust through attestations.

## Use Cases

- **E-commerce sites** - Build trust with customers
- **SaaS applications** - Verify legitimacy for enterprise clients  
- **Content publishers** - Establish authenticity
- **Web3 dApps** - Connect on-chain and off-chain identity

## Prerequisites

- Domain you control (e.g., `store.example.com`)
- Ability to add files to `/.well-known/` directory
- Web3 wallet with testnet OMA tokens

## Step-by-Step Guide

### 1. Create DID Document

Create a file at `https://yourdomain.com/.well-known/did.json`:

```json
{
  "@context": [
    "https://www.w3.org/ns/did/v1"
  ],
  "id": "did:web:store.example.com",
  "verificationMethod": [
    {
      "id": "did:web:store.example.com#owner",
      "type": "EcdsaSecp256k1VerificationKey2019",
      "controller": "did:web:store.example.com",
      "blockchainAccountId": "eip155:1:0xYourWalletAddress"
    }
  ],
  "authentication": [
    "did:web:store.example.com#owner"
  ]
}
```

**Important:** Replace `0xYourWalletAddress` with your actual wallet address.

### 2. Verify DID Document is Accessible

Test in browser:
```
https://store.example.com/.well-known/did.json
```

Should return your DID document. Common issues:
- 404: File not found - check path
- CORS errors: Add `Access-Control-Allow-Origin: *` header
- HTTPS required: Ensure SSL certificate is valid

### 3. Register via Wizard

**Go to:** [https://registry.omatrust.org](https://registry.omatrust.org)

**Step 1 - Verification:**
- App Name: "My Store"
- Version: "1.0.0"
- DID Type: `did:web`
- DID: `did:web:store.example.com`
- Interfaces: ☑ Human
- Click "Verify DID Ownership"
- Wait for "✅ Verified"

**Step 2 - On-Chain:**
- Data URL: (auto-generated or custom)
- Traits: `ecommerce`, `payments`, `web3`

**Step 3 - Common Info:**
- Description: "Decentralized marketplace for digital goods"
- Image: `https://store.example.com/logo.png`
- Publisher: "Example Inc"
- External URL: `https://store.example.com`

**Step 4 - Media:**
- Screenshots: Add at least one
  - `https://store.example.com/screenshots/home.png`
  - `https://store.example.com/screenshots/product.png`

**Step 5 - Distribution:**
- Platforms → Web:
  - Launch URL: `https://store.example.com`

**Step 6 - Review:**
- Review all fields
- Verify generated JSON
- Click "Submit"
- Approve transaction in wallet

**Done!** Your website is now registered.

### 4. Display Trust Badge

Add OMATrust badge to your site:

```html
<!-- Simple HTML badge -->
<div class="omatrust-badge">
  <img src="https://cdn.omatrust.org/badges/verified.svg" alt="OMATrust Verified" />
  <span>Verified on OMATrust</span>
  <a href="https://registry.omatrust.org/service/did:web:store.example.com">View Attestations</a>
</div>
```

**React component:**
```tsx
import { useEffect, useState } from 'react';
import { verifyService } from '@/lib/omatrust';

export function TrustBadge() {
  const [verification, setVerification] = useState(null);
  
  useEffect(() => {
    verifyService('did:web:store.example.com', 1)
      .then(setVerification);
  }, []);
  
  if (!verification) return null;
  
  return (
    <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
      {verification.attestations.ownerVerified ? (
        <>
          <CheckCircle className="text-green-600" />
          <span className="text-sm">OMATrust Verified</span>
        </>
      ) : (
        <>
          <AlertCircle className="text-yellow-600" />
          <span className="text-sm">Verification Pending</span>
        </>
      )}
    </div>
  );
}
```

### 5. Collect User Reviews

**Integrate review widget:**

```html
<!-- OMATrust review widget (future) -->
<script src="https://cdn.omatrust.org/widgets/reviews.js"></script>
<div 
  class="omatrust-reviews" 
  data-did="did:web:store.example.com"
  data-theme="light"
></div>
```

**Or build custom:**
```typescript
async function submitReview(did: string, rating: number, comment: string) {
  // User must be verified (proof of personhood)
  const reviewAttestation = {
    did,
    rating,
    comment,
    timestamp: Date.now()
  };
  
  // Submit to reputation service
  await fetch('https://reputation.oma3.org/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reviewAttestation)
  });
}
```

## Advanced: Custom Metadata Hosting

Instead of using default dataUrl, host your own:

### 1. Create Metadata Endpoint

```javascript
// Express.js example
app.get('/omatrust/metadata', (req, res) => {
  const metadata = {
    name: "My Store",
    description: "Decentralized marketplace",
    image: "https://store.example.com/logo.png",
    external_url: "https://store.example.com",
    publisher: "Example Inc",
    screenshotUrls: [
      "https://store.example.com/screenshots/home.png",
      "https://store.example.com/screenshots/product.png"
    ],
    platforms: {
      web: {
        launchUrl: "https://store.example.com"
      }
    },
    traits: ["ecommerce", "payments", "web3"]
  };
  
  res.json(metadata);
});
```

### 2. Register with Custom URL

In wizard Step 2:
- Toggle "Customize Data URL"
- Enter: `https://store.example.com/omatrust/metadata`
- Wizard fetches and validates
- Computes hash automatically
- Proceeds to mint

### 3. Update Metadata Anytime

Since you control the endpoint:

```javascript
// Update metadata dynamically
app.get('/omatrust/metadata', async (req, res) => {
  // Fetch latest from database
  const metadata = await db.getLatestMetadata();
  res.json(metadata);
});
```

**Important:** If metadata changes, update dataHash on-chain:
```bash
npx hardhat registry-set-metadata-json \
  --did "did:web:store.example.com" \
  --major 1 \
  --minor 0 \
  --patch 1 \
  --jsonfile "./metadata.json" \
  --network omachainTestnet
```

## SEO & Discoverability

### Add Structured Data

Help search engines understand OMATrust verification:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "My Store",
  "url": "https://store.example.com",
  "sameAs": [
    "https://registry.omatrust.org/service/did:web:store.example.com"
  ],
  "identifier": {
    "@type": "PropertyValue",
    "propertyID": "OMATrust DID",
    "value": "did:web:store.example.com"
  }
}
</script>
```

### Meta Tags

```html
<meta name="omatrust:did" content="did:web:store.example.com" />
<meta name="omatrust:verified" content="true" />
<meta name="omatrust:registry" content="https://registry.omatrust.org" />
```

## Monitoring & Maintenance

### Monitor Attestations

```typescript
// Check attestation status daily
async function checkAttestationStatus() {
  const didHash = ethers.id('did:web:store.example.com');
  const verified = await resolver.checkDID(didHash, yourAddress);
  
  if (!verified) {
    alert('Attestation expired or revoked - re-verify!');
  }
}

setInterval(checkAttestationStatus, 86400000); // Daily
```

### Update for New Versions

When releasing v2.0:
```
1. Keep v1.0 as "Active" initially
2. Register v2.0 separately (new major version)
3. Test v2.0 in production
4. When stable:
   - Mark v1.0 as "Deprecated"
   - Keep v2.0 as "Active"
5. Eventually mark v1.0 as "Replaced"
```

## Example: E-Commerce Store

**Full registration for online store:**

```json
{
  "name": "DecentralMart",
  "description": "Decentralized marketplace for digital and physical goods",
  "image": "https://decentralmart.com/logo-1024.png",
  "external_url": "https://decentralmart.com",
  "publisher": "DecentralMart Inc",
  "summary": "Shop with crypto, earn rewards, own your data",
  "legalUrl": "https://decentralmart.com/legal",
  "supportUrl": "https://help.decentralmart.com",
  "screenshotUrls": [
    "https://decentralmart.com/screenshots/homepage.png",
    "https://decentralmart.com/screenshots/product-page.png",
    "https://decentralmart.com/screenshots/checkout.png"
  ],
  "videoUrls": [
    "https://youtube.com/watch?v=demo-video"
  ],
  "platforms": {
    "web": {
      "launchUrl": "https://decentralmart.com"
    }
  },
  "traits": [
    "ecommerce",
    "payments",
    "web3",
    "pay:x402"
  ]
}
```

**Registration stats:**
- DID: `did:web:decentralmart.com`
- Version: 1.0.0
- Interface: Human (1)
- Traits: 4
- Attestations: 2 (DID + dataHash)

**After 6 months:**
- Security audit obtained → +1 attestation
- User reviews: 4.2/5 from 87 users → +87 attestations
- Uptime: 99.98% → +1 attestation (monthly)
- **Total: 91+ attestations**
- **Trust score: 95/100**

## Troubleshooting

**"DID document not found"**
- Verify file is at `/.well-known/did.json`
- Check HTTPS (HTTP won't work)
- Test in incognito (rule out caching)

**"Wallet address not in DID document"**
- Ensure `blockchainAccountId` matches your wallet
- Format: `eip155:1:0xYourAddress` (include chain ID)

**"Transaction failed: App already exists"**
- DID + major version combo must be unique
- Use different major version (v2, v3) or different DID

## Next Steps

- **[Register API](./register-api.md)** - API/GraphQL/REST services
- **[Register Smart Contract](./register-smart-contract.md)** - On-chain apps
- **[Client Guide](../client-guide.md)** - Query your registered service

---

**Questions?** Join OMA3 Discord or check the [FAQ](../faq.md).


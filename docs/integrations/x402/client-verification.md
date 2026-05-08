---
title: Client Verification
---

# Client Verification

> This guide is for **verifiers** — clients, aggregators, trust scoring engines, and any software that needs to check whether an x402 proof attached to a User Review is legitimate. For submitting reviews with x402 proofs, see [Client Integration](./client-attestation). For setting up offer-receipt signing on your server, see [Resource Server Integration](./resource-server).

## The Core Principle

**Signature verification is NOT authorization.**

Verifying a JWS or EIP-712 signature proves that a specific key signed the artifact. It does not prove that key is authorized to act on behalf of the service identified by `resourceUrl`. These are two separate questions:

1. **Was this artifact signed by the claimed key?** → Signature verification (this page)
2. **Is that key authorized for this service?** → Authorization check (via `getControllerAuthorization`)

Both checks are required for a proof to be considered valid.

## Two Signature Formats

x402 signed offers and receipts come in two formats:

| Format | Signature Type | Verification Output | Identity |
|--------|---------------|-------------------|----------|
| **JWS** | JSON Web Signature (compact serialization) | `did:jwk` — the durable controller DID derived from the public key | Non-EVM keys (EC P-256, Ed25519, etc.) and `did:web` services |
| **EIP-712** | Ethereum typed-data signature | Recovered signer address (EVM `0x...`) | EVM wallets and `did:pkh` services |

Both formats produce equivalent trust signals. The verification flow differs slightly but converges at the authorization check.

## JWS Verification Path

JWS artifacts contain the signature in compact serialization format. The public key is obtained either from an embedded `jwk` header (self-contained) or by resolving the `kid` header (a DID URL pointing to a DID document).

### Verify the Signature

```ts
import { verifyX402JwsReceipt, verifyX402JwsOffer } from "@oma3/omatrust/reputation";

// For receipts
const result = await verifyX402JwsReceipt(signedReceipt);

// For offers
const result = await verifyX402JwsOffer(signedOffer);
```

On success, `result` contains:

```ts
{
  valid: true,
  header: { alg: "ES256", kid: "did:web:api.example.com#key-1", jwk: { ... } },
  payload: { resourceUrl: "https://api.example.com/data", payer: "0x...", ... },
  kid: "did:web:api.example.com#key-1",
  publicKeyJwk: { kty: "EC", crv: "P-256", x: "...", y: "..." },
  publicKeySource: "embedded-jwk",  // or "kid-resolution"
  publicKeyDid: "did:jwk:eyJrdHkiOiJFQyIs..."  // durable controller DID
}
```

Key fields:
- `publicKeyDid` — the `did:jwk` derived from the verified public key. This is the **durable controller DID** you pass to authorization checks. It never changes, even if the `kid` DID URL is updated later.
- `publicKeySource` — whether the key came from an embedded `jwk` header (offline-verifiable) or was resolved from the `kid` DID URL.
- `kid` — the DID URL from the JWS header. This is a mutable reference — do not use it as a controller DID.

### Check Authorization

```ts
import { extractAuthorizationMetadata } from "@oma3/omatrust/identity";
import { getControllerAuthorization } from "@oma3/omatrust/reputation";

// Bridge verification result → authorization params
const meta = extractAuthorizationMetadata(result);
// meta = {
//   controllerDid: "did:jwk:eyJrdHkiOiJFQyIs...",
//   subjectDid: "did:web:api.example.com",
//   resourceUrl: "https://api.example.com/data",
//   issuedAt: 1738972800,
//   kid: "did:web:api.example.com#key-1",
//   publicKeyJwk: { ... }
// }

// Check the authorization window
const auth = await getControllerAuthorization({
  controllerDid: meta.controllerDid,
  subjectDid: meta.subjectDid,
  provider,
});

if (auth.authorized) {
  // Key was authorized for this service — proof is valid
}
```

`extractAuthorizationMetadata` derives `subjectDid` from `resourceUrl` (e.g., `https://api.example.com/data` → `did:web:api.example.com`) and extracts the `controllerDid` from the verification result's `publicKeyDid`.

## EIP-712 Verification Path

EIP-712 artifacts contain the payload as a separate field and a hex-encoded signature. The signer address is recovered directly from the signature — no DID resolution needed.

### Verify the Signature

```ts
import { verifyX402Eip712Receipt, verifyX402Eip712Offer } from "@oma3/omatrust/reputation";

// For receipts
const result = verifyX402Eip712Receipt(signedReceipt);

// For offers
const result = verifyX402Eip712Offer(signedOffer);
```

On success, `result` contains:

```ts
{
  valid: true,
  payload: { resourceUrl: "https://api.example.com/data", payer: "0x...", ... },
  signer: "0x1234567890abcdef1234567890abcdef12345678",  // recovered address
  artifactType: "receipt"  // or "offer"
}
```

### Check Authorization

For EIP-712, the simplest authorization check is comparing the recovered signer to `payload.payTo`:

```ts
if (result.signer.toLowerCase() === result.payload.payTo.toLowerCase()) {
  // The payment recipient signed this artifact — strong signal
}
```

For richer authorization checks (e.g., when the signing key is different from the payment address), convert to a `did:pkh` and use `getControllerAuthorization`:

```ts
import { getControllerAuthorization } from "@oma3/omatrust/reputation";
import { buildEvmDidPkh, buildDidWeb, getDomainFromDidWeb } from "@oma3/omatrust/identity";

const controllerDid = buildEvmDidPkh(1, result.signer);
const subjectDid = buildDidWeb(new URL(result.payload.resourceUrl).hostname);

const auth = await getControllerAuthorization({
  controllerDid,
  subjectDid,
  provider,
});
```

## Using `verifyProof` (High-Level)

If you're verifying proofs attached to attestations (rather than standalone artifacts), use the high-level `verifyProof` function. It automatically routes to the correct verification path based on the proof's format:

```ts
import { verifyProof } from "@oma3/omatrust/reputation";

const result = await verifyProof({
  proof: attestation.proofs[0],  // ProofWrapper with proofType "x402-receipt" or "x402-offer"
  provider,
  expectedSubjectDid: attestation.subject,
});
```

`verifyProof` handles:
- `x402-offer` / `x402-receipt` with `format: "jws"` → JWS cryptographic verification
- `x402-offer` / `x402-receipt` with `format: "eip712"` → EIP-712 cryptographic verification
- Other formats → backward-compatible shape-only validation

## Trust Evaluation

After signature verification and authorization checks, evaluate the trust level:

| Condition | Trust Level | Meaning |
|-----------|-------------|---------|
| Signature valid + Tier 3 (Key Binding) active | Highest | Key is authorized with explicit purpose, expiration, and revocation control |
| Signature valid + Tier 2 (Controller Witness) covers `issuedAt` | High | Key was provably authorized at the time the artifact was signed |
| Signature valid + Tier 1 (live DNS/did.json) confirms key | Moderate | Key is authorized *now*, but no historical proof |
| Signature valid + no authorization evidence | Low | Signature is cryptographically valid but key authorization is unconfirmed |
| Signature invalid | None | Reject the proof |

For User Reviews, the trust level of the attached proof determines whether the review is classified as "verified" (high confidence the reviewer used the service) or "unverified" (the proof couldn't be fully validated).

## Complete Verification Example

```ts
import { verifyX402JwsReceipt, getControllerAuthorization } from "@oma3/omatrust/reputation";
import { extractAuthorizationMetadata } from "@oma3/omatrust/identity";

async function verifyReceiptProof(signedReceipt, provider) {
  // 1. Verify the cryptographic signature
  const verification = await verifyX402JwsReceipt(signedReceipt);
  if (!verification.valid) {
    return { trusted: false, reason: verification.error.message };
  }

  // 2. Extract authorization metadata
  const meta = extractAuthorizationMetadata(verification);

  // 3. Check controller authorization
  const auth = await getControllerAuthorization({
    controllerDid: meta.controllerDid,
    subjectDid: meta.subjectDid,
    provider,
  });

  if (!auth.authorized) {
    return { trusted: false, reason: "Signing key not authorized for this service" };
  }

  // 4. Check timing — was the key authorized when the receipt was issued?
  const issuedAt = BigInt(meta.issuedAt);
  if (auth.anchoredFrom && issuedAt >= auth.anchoredFrom) {
    if (!auth.until || issuedAt < auth.until) {
      return { trusted: true, tier: "high", reason: "Controller witness covers issuance time" };
    }
  }

  if (auth.currentlyVerified) {
    return { trusted: true, tier: "moderate", reason: "Live evidence confirms key" };
  }

  return { trusted: false, reason: "Key authorization window does not cover issuance time" };
}
```

## Further Reading

- [Resource Server Integration](./resource-server) — Trust tiers and key binding setup
- [Client Integration](./client-attestation) — Submitting reviews with x402 proofs
- [Verification Flow](/reputation/verification-flow) — General proof verification process
- [Definitions: DID URL vs Controller DID](/start-here/definitions#did-url-vs-controller-did) — Why `kid` ≠ controller DID
- [Controller Witness API](/api/controller-witness) — The witness attestation endpoint
- [Reputation SDK Reference](/sdk/api-reference/reputation-sdk) — `verifyX402Jws*`, `verifyX402Eip712*`, `getControllerAuthorization`
- [Identity SDK Reference](/sdk/api-reference/identity-sdk) — `extractAuthorizationMetadata`, `isSameControllerId`

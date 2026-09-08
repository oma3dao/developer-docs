---
title: "Use Case: Authorize Signing Keys"
sidebar_position: 6
---

# Use Case: Authorize Signing Keys

Establish that a specific wallet or key is authorized to act on behalf of your organization's DID. This is a prerequisite for publishing attestations (like Responsibility Claims) where controller authorization is verified.

## When to Use This

- You need a wallet to sign attestations on behalf of your organization's `did:web`
- You're setting up a new signing key for your team
- You need to rotate to a new key while the old one is still active
- You want to publicly authorize an x402 signing key for payment receipts

## How It Works

OMATrust uses a two-step pattern to establish controller authorization:

1. **Key Binding** — Declare that a public key (identified by its `did:pkh`) is authorized to act for your subject DID. This requires a proof of shared control between the subject and the key.
2. **Controller Witness** — A trusted third-party witness observes your offchain controller assertion (e.g., a DNS TXT record or DID document entry) and anchors that observation on-chain with a timestamp.

Together, these create a verifiable authorization window: the key is authorized from the witness observation timestamp until the Key Binding is revoked or expires.

## Step 1: Publish a Key Binding

Declare that your signing wallet is authorized to act for your organization:

```ts
import { submitAttestation } from "@oma3/omatrust/reputation";

const result = await submitAttestation({
  signer,  // The key being authorized (proves possession)
  chainId: 66238,
  easContractAddress: "0x8835AF90f1537777F52E482C8630cE4e947eCa32",
  schemaUid: "0x807b38ce9aa23fdde4457de01db9c5e8d6ec7c8feebee242e52be70847b7b966",
  schema: "string subject, string keyId, string publicKeyJwk, string[] keyPurpose, string[] proofs, uint256 issuedAt, uint256 effectiveAt, uint256 expiresAt",
  data: {
    subject: "did:web:your-organization.com",
    keyId: "did:pkh:eip155:66238:0xYourSigningWallet",
    publicKeyJwk: JSON.stringify({ kty: "EC", crv: "secp256k1", x: "...", y: "..." }),
    keyPurpose: ["assertionMethod"],
    proofs: [JSON.stringify({
      proofType: "pop-eip712",
      proofPurpose: "shared-control",
      proofObject: { /* EIP-712 signature proving key possession */ }
    })],
    issuedAt: Math.floor(Date.now() / 1000),
    effectiveAt: Math.floor(Date.now() / 1000),
    expiresAt: 0,  // No expiration — revoke when rotating
  },
  revocable: true,
});
```

## Step 2: Get a Controller Witness

A Controller Witness anchors the observation that your DID document (or DNS record) asserts the signing key as a controller. This is typically done by a trusted witness server that periodically checks your assertion.

**Set up the offchain assertion:**

Add a DID document entry or DNS TXT record asserting the controller relationship. For `did:web`, this means your `/.well-known/did.json` should include the signing key in its `verificationMethod` and `assertionMethod` arrays.

**Trigger or wait for witness observation:**

The OMATrust witness server will observe your assertion and publish a Controller Witness attestation on-chain. You can also request observation via the [Controller Confirm API](/api/controller-confirm).

Once the witness attestation is on-chain, the authorization window is established: the key is authorized from `observedAt` onward.

## Step 3: Use the Authorized Key

Now the signing wallet can issue attestations (Responsibility Claims, Endorsements, etc.) on behalf of your organization. When consumers verify those attestations, they'll check that:

1. A valid Key Binding exists linking the attester wallet to the subject DID
2. A Controller Witness confirms the relationship was observed before the attestation was issued
3. The attestation's `issuedAt` falls within the authorization window

## Key Rotation

To rotate to a new key:

1. Publish a new Key Binding for the replacement key
2. Update your DID document with the new key
3. Wait for a new Controller Witness observation
4. Revoke the old Key Binding

Multiple non-expired, non-revoked Key Bindings can coexist — rotation doesn't implicitly revoke earlier bindings.

## Using the Portal (No Code)

The [OMATrust Portal](https://reputation.omatrust.org) supports Key Binding creation through the attestation form:

1. Connect your signing wallet
2. Click "Publish" → select "Key Binding" schema
3. Fill in your organization's DID as the subject, and the connected wallet as the key
4. Submit with the shared-control proof

For the Controller Witness step, use the [Controller Confirm flow](/api/controller-confirm) or contact OMA3 for witness server access.

## Further Reading

- [Attestation Types: Key Binding](/reputation/attestation-types#key-binding) — Full schema documentation
- [Attestation Types: Controller Witness](/reputation/attestation-types#controller-witness) — Witness attestation details
- [Controller Confirm API](/api/controller-confirm) — Programmatic witness request
- [Use Case: Claim Responsibility for a File](/start-here/use-case-artifact-claims) — Use your authorized key to claim artifacts
- [x402 Integration](/integrations/x402/overview) — Authorize keys for x402 payment signing

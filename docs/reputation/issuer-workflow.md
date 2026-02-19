---
title: Issuer Workflow
---

# Issuer Workflow

This page covers how to create and submit attestations in the OMATrust reputation system. Whether you're a security auditor issuing assessments, a user writing a review, a witness server anchoring controller observations, or an organization issuing endorsements — the workflow follows the same core pattern.

## Who Can Issue Attestations?

Anyone can create an attestation. However, many attestation types only carry meaningful trust if the attester is recognized by consumers. In practice:

| Attestation Type | Typical Issuers | Approved Attester Required? |
|-----------------|-----------------|----------------------------|
| User Review | End users, platform intermediaries | No — anyone can review |
| User Review Response | Service operators, authorized delegates | No — but responder coherence is verified |
| Linked Identifier | The entity controlling both identifiers, or a trusted verifier | No — but proofs are needed for trustless validation |
| Key Binding | The entity controlling the subject DID | No — but proofs are required |
| Controller Witness | Witness servers | Yes — consumers maintain witness allowlists |
| Endorsement | Organizations, trusted entities | Yes — trust depends entirely on attester identity |
| Certification | Certification Bodies | Yes — must be a recognized CB |
| Security Assessment | Security auditors, test labs | Yes — must be a recognized assessor |

### Becoming an Approved Attester

For attestation types where attester identity is the primary trust signal (Controller Witness, Endorsement, Certification, Security Assessment), consumers need to be able to verify who you are. OMA3 will maintain trusted attester lists as a starting point, but anyone can maintain their own. A consumer might trust ISO 27001 certification bodies, SOC 2 auditors, Common Criteria evaluation labs, or FIPS validators — each with their own attester lists independent of OMA3. The system is designed to support multiple competing trust hierarchies, not a single gatekeeper.

That said, if you want to be on the OMA3-maintained lists specifically:

:::note Early Stage Process
OMA3 is developing a formal Authorized Attester Program with defined criteria and processes for each attestation type. Until that program launches, we're using a lighter-weight process to onboard trusted attesters. Reach out and we'll work with you directly.
:::

1. **Contact OMA3** — Submit an inquiry through the [OMA3 contact form](https://www.oma3.org/#contact) with your organization details, the types of attestations you intend to issue, your verification methodology, and your credentials.

2. **Get authorized** — OMA3 evaluates your application based on track record, methodology transparency, and ecosystem alignment. Approved attesters are added to governance-maintained allowlists that consumers can reference.

3. **Maintain good standing** — Respond to disputes promptly, maintain transparent operations, keep attestations current, and participate in governance discussions.

This process exists because an endorsement from an unknown entity or a security assessment from an unvetted auditor provides little value to consumers. The attester's identity *is* the trust signal for these attestation types.

## Creating an Attestation

You can create attestations programmatically via the SDK, or use the web interface at [reputation.omatrust.org](https://reputation.omatrust.org) if you prefer a visual workflow.

### 1. Choose the Right Schema

Select the attestation type that matches your use case:

- Proving identity linkage? → **Linked Identifier**
- Authorizing a signing key? → **Key Binding**
- Witnessing an offchain controller assertion? → **Controller Witness**
- Reviewing a service as a user? → **User Review**
- Responding to a review as a service operator? → **User Review Response**
- Expressing support or approval? → **Endorsement**
- Certifying compliance with a program? → **Certification**
- Recording a security evaluation? → **Security Assessment**

### 2. Construct the JSON Payload

Build the attestation object conforming to the schema. All attestations share common fields:

```json
{
  "attester": "did:web:your-organization.com",
  "subject": "did:web:service-being-attested.com",
  "issuedAt": 1720000000
}
```

Add type-specific fields as defined in [Attestation Types](/reputation/attestation-types). For example, a User Review:

```json
{
  "attester": "did:pkh:eip155:66238:0xReviewerWallet",
  "subject": "did:web:cool-api.example.com",
  "ratingValue": 4,
  "reviewBody": "Fast API responses, good documentation. Minor issues with rate limiting.",
  "issuedAt": 1720000000
}
```

Or a Security Assessment:

```json
{
  "attester": "did:web:security-firm.example.com",
  "subject": "did:web:defi-protocol.example.com",
  "version": "2.1.0",
  "issuedAt": 1720000000,
  "effectiveAt": 1720000000,
  "expiresAt": 1751536000,
  "payload": {
    "assessmentKind": "security-audit",
    "outcome": "pass",
    "metrics": {
      "critical": 0,
      "high": 0,
      "medium": 2,
      "low": 5,
      "info": 12
    },
    "reportURI": "https://security-firm.example.com/reports/defi-protocol-2025.pdf"
  },
  "payloadVersion": "1.0.0"
}
```

### 3. Validate Against the Schema

Before submitting, validate your JSON against the canonical JSON Schema for the attestation type. The schemas are published in the [OMA3 schema repository](https://github.com/oma3dao/rep-attestation-tools-evm-solidity/tree/main/schemas-json).

This is a hard requirement — implementations must validate before issuing or accepting an attestation.

### 4. Construct Proofs (When Applicable)

Some attestation types require or benefit from proofs. See [Verification Flow](/reputation/verification-flow) for the full proof type reference.

**Key Binding** — At least one proof is required, using `proofPurpose = shared-control`. The proof's Subject must match the attestation's `subject`, and Controller must match `keyId`.

**Linked Identifier** — Proofs are required for proof-based trust. Same binding pattern: Subject = `subject`, Controller = `linkedId`, purpose = `shared-control`.

**User Review** — Proofs are optional but significantly increase trust level:
- Include an `x402-receipt` if you have one (highest confidence — proves you paid for and received the service)
- Include a `tx-interaction` proof if you interacted with the service's smart contract
- Include an `evidence-pointer` if you can demonstrate account existence on the service

Each proof is wrapped in the standard proof wrapper:

```json
{
  "proofType": "x402-receipt",
  "proofPurpose": "commercial-tx",
  "proofObject": { ... }
}
```

The `proofObject` format depends on the `proofType` — see the [Proof Specification](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-proofs.md) for native formats.

### 5. Submit to a Transport

The attestation model is transport-independent. The same JSON payload can be submitted to different systems:

**EAS (Ethereum Attestation Service)** — The primary transport today. Attestations are encoded and submitted on-chain, becoming permanently anchored and publicly queryable.

**Delegated attestation** — Submit through a relayer that pays gas on your behalf. Useful for end users who don't want to manage gas.

**Other transports** — The specification supports BAS, centralized systems, and federated indexers. Each transport publishes its own binding rules for how the JSON payload maps to its storage format.

## Revocation

Attesters can revoke their attestations when circumstances change. Revocation makes the attestation inactive — it remains as a historical record but must not be treated as active by consumers.

When to revoke:
- A Linked Identifier relationship no longer holds
- A Key Binding should be deactivated (key compromised, rotated out)
- A Security Assessment's findings are no longer accurate
- A Certification's requirements are no longer met
- A User Review was issued in error

Linked Identifier and Key Binding attestations **must** be revocable. Consumers are required to reject any such attestation that isn't revocable on the transport.

## Supersession

For User Reviews, the update mechanism is supersession rather than revocation. To update a review, issue a new User Review attestation for the same subject. Consumers must consider only the most recent attestation (by `issuedAt`) from a given attester for a given subject.

## Best Practices

- **Validate against the schema** before submitting — malformed attestations will be rejected by compliant consumers
- **Set appropriate expiration dates** — Security assessments and certifications should expire; a two-year-old audit is stale
- **Include proofs where possible** — Proofs enable trustless verification and increase the trust level of your attestation
- **Document your methodology** — For security assessments and certifications, transparency about your process builds consumer confidence
- **Use `effectiveAt` strategically** — If you need a Controller Witness to be issued before your attestation becomes active, set `effectiveAt` in the future to give the witness time to observe and attest
- **Revoke promptly** — If an attestation is no longer accurate, revoke it. Stale attestations erode trust in the system

## Further Reading

- [Attestation Types](/reputation/attestation-types) — Schema definitions for each type
- [Verification Flow](/reputation/verification-flow) — How consumers verify your attestations
- [Consumer Workflow](/reputation/consumer-workflow) — How consumers query and interpret attestations
- [OMATrust Reputation Specification](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-reputation.md) — Formal definitions

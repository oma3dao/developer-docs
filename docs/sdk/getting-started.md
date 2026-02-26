---
sidebar_position: 1
---

# SDK Getting Started

This guide is for the npm package:

`@oma3/omatrust`

:::caution Alpha Release
The SDK is currently in alpha. APIs may change between releases.
:::

## Install

```bash
npm install @oma3/omatrust ethers
```

If you use the reputation module (`submitAttestation`, `getAttestation`, etc.), you also need the EAS SDK:

```bash
npm install @ethereum-attestation-service/eas-sdk
```

The identity and app-registry modules (`normalizeDid`, `didToAddress`, CAIP utilities, registry helpers) work with just `ethers` — no EAS SDK required.

> **Note:** `ethers` and `@ethereum-attestation-service/eas-sdk` are peer dependencies. npm v7+ installs peer dependencies automatically, but will only warn (not error) if they're missing — so double-check they're in your `node_modules` if you use `--legacy-peer-deps`. If you use pnpm or yarn, you may need to install them explicitly.
>
> The `canonicalize` package (used internally for JCS / RFC 8785 canonicalization) is a regular dependency and is bundled automatically — you don't need to install it separately.

## Quick Start

For hands-on code walkthroughs, see the quickstart guides:

- [Verify Reputation](/start-here/quickstart-verify) — Read and verify an on-chain attestation
- [Publish an Attestation](/start-here/quickstart-publish) — Submit a verifiable attestation to EAS

## Gas Funding for Direct Attestations

If you use direct on-chain submission (`submitAttestation`), the signing wallet must have enough native gas token on the target chain to pay transaction fees.

- On OMAChain Testnet, fund the signer with OMA using the [OMAChain Testnet faucet](https://faucet.testnet.chain.oma3.org/)
- If the wallet has insufficient balance, submission will fail before the attestation is recorded
- User review attestations can avoid gas fees on OMAChain by using `submitDelegatedAttestation` (see [Delegated Attestation API](/api/delegated-attestation))

## Module Map

| Import path                        | Description                                                                | EAS SDK required? |
| ---------------------------------- | -------------------------------------------------------------------------- | ----------------- |
| `@oma3/omatrust/reputation`        | Attestation submission, querying, verification, proofs, controller witness | Yes               |
| `@oma3/omatrust/identity`          | DID normalization, hashing, CAIP utilities, JSON canonicalization           | No                |
| `@oma3/omatrust/app-registry`      | ERC-8004 helpers: traits, interfaces, status, versioning, data hash        | No                |

## Error Handling

All SDK functions throw `OmaTrustError` with a stable `code` property:

```ts
try {
  await submitAttestation(params);
} catch (err) {
  if (err.code === "NETWORK_ERROR") {
    // retry or switch RPC
  }
}
```

See the [Reputation Reference](/sdk/api-reference/reputation-sdk) and [Identity Reference](/sdk/api-reference/identity-sdk) for the full error code tables.

## Real-World Example

For a production example of the SDK in use, see the [rep-attestation-frontend](https://github.com/oma3dao/rep-attestation-frontend) repository — the source for the OMATrust reputation web interface at [reputation.omatrust.org](https://reputation.omatrust.org). It demonstrates attestation submission, delegated attestation flows, proof creation, and controller witness integration.

## Further Reading

- [Reputation SDK Overview](/sdk/guides) — Workflow examples for attestation and verification
- [Reputation SDK Reference](/sdk/api-reference/reputation-sdk) — Canonical function signatures and types
- [Identity SDK Reference](/sdk/api-reference/identity-sdk) — DID, CAIP, and data utility functions
- [App Registry Reference](/app-registry/registry-sdk-reference) — Canonical function signatures for app registry
- [Attestation Types](/reputation/attestation-types) — End-to-end proof workflow documentation
- [OMATrust Specification](https://github.com/oma3dao/omatrust-docs) — Formal protocol specification

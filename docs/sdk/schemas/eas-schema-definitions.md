---
title: EAS Schema Definitions
sidebar_position: 2
---

# EAS Schema Definitions

These are the on-chain EAS (Ethereum Attestation Service) schema strings for each OMATrust attestation type. They are generated from the [canonical JSON Schemas](./json-schemas.md) using the `generate-eas-object` Hardhat task in the [`rep-attestation-tools-evm-solidity`](https://github.com/oma3dao/rep-attestation-tools-evm-solidity) repository.

Each schema string is a comma-separated list of ABI-typed fields that EAS uses to encode and decode attestation data on-chain.

## User Review

```
string subject, string version, uint256 ratingValue, string reviewBody, string[] screenshotUrls, string[] proofs
```

- Revocable: No
- Testnet UID: `0x7ab3911527e5e47eaab9f5a2c571060026532dde8cb4398185553053963b2a47`

## User Review Response

```
string subject, string refUID, string responseBody
```

- Revocable: No
- Testnet UID: `0x53498ae8ae4928a8789e09663f44d6e3c77daeb703c3765aa184b958c3ca41be`

## Endorsement

```
string subject, string organization, string version, string policyURI, string payload, string payloadVersion, string payloadSpecURI, string payloadSpecDigest, uint256 issuedAt, uint256 effectiveAt, uint256 expiresAt
```

- Revocable: No
- Testnet UID: `0xb0cf93ef0f3feb858aa5d07a54f6589da5852883f378dfd0cae5315da1d679ac`

## Certification

```
string subject, string organization, string version, string versionHW, string subjectURI, string programID, string programURI, string assessor, string assessorURI, string certificationLevel, string outcome, string reportURI, string reportDigest, string payload, string payloadVersion, string payloadSpecURI, string payloadSpecDigest, uint256 issuedAt, uint256 effectiveAt, uint256 expiresAt
```

- Revocable: No
- Testnet UID: `0x2b0d1100f7943c0c2ea29e35c1286bd860fa752124e035cafb503bb83f234805`

## Security Assessment

```
string subject, string organization, string version, string versionHW, string payload, string payloadVersion, string payloadSpecURI, string payloadSpecDigest, uint256 issuedAt, uint256 effectiveAt, uint256 expiresAt
```

- Revocable: No
- Testnet UID: `0x67bcc2424e3721d56e85bb650c6aba8bf7f1711d9c9a434c3afae3a22d23eed7`

## Key Binding

```
string subject, string keyId, string publicKeyJwk, string[] keyPurpose, string[] proofs, uint256 issuedAt, uint256 effectiveAt, uint256 expiresAt
```

- Revocable: Yes
- Testnet UID: `0x807b38ce9aa23fdde4457de01db9c5e8d6ec7c8feebee242e52be70847b7b966`

## Linked Identifier

```
string subject, string linkedId, string method, string[] proofs, uint256 issuedAt, uint256 effectiveAt, uint256 expiresAt
```

- Revocable: Yes
- Testnet UID: `0xed79388b434965a35d50573b75f4bbd6e3bc7912103c4a6ac0aff6a510ccadac`

## Controller Witness

```
string subject, string controller, string method, uint256 observedAt
```

- Revocable: No
- Testnet UID: `0xc81419f828755c0be2c49091dcad0887b5ca7342316dfffb4314aadbf8205090`

## Schema UID Calculation

Schema UIDs are deterministic. They are computed as:

```
keccak256(abi.encodePacked(schema, resolverAddress, revocable))
```

Where `resolverAddress` is `0x0000000000000000000000000000000000000000` (zero address) for schemas deployed without a resolver.

The SDK and tooling provide a `calculateSchemaUID` helper:

```ts
import { ethers } from "ethers";

const uid = ethers.keccak256(
  ethers.solidityPacked(
    ["string", "address", "bool"],
    [schemaString, resolverAddress, revocable]
  )
);
```

## Revocability

Most OMATrust schemas are non-revocable. The exceptions are:

- **Key Binding** — keys can be rotated or compromised, so revocation is supported
- **Linked Identifier** — linked accounts can be unlinked, so revocation is supported

Revocability is set at schema registration time and cannot be changed after deployment.

## Regenerating EAS Schemas

If you modify a JSON Schema file, regenerate the EAS object with:

```bash
npx hardhat generate-eas-object --schema schemas-json/<name>.schema.json
```

This writes a `.eas.json` file to the `generated/` directory. Deploy it with:

```bash
npx hardhat deploy-eas-schema --file generated/<Name>.eas.json --network omachainTestnet
```

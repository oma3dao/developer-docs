---
sidebar_position: 6
---

# App Registry SDK Reference

Canonical function reference for:

- `@oma3/omatrust/app-registry`

Built on ERC-8004 with OMA3 extensions for internet service registration, trait-based discovery, and data integrity verification.

> **Note:** The App Registry module is available for development and testing but has not been audited for production use. APIs may change before the production launch.

## Core Types

```ts
type Hex = `0x${string}`;

type InterfaceFlags = { human: boolean; api: boolean; smartContract: boolean };
type InterfaceType = "human" | "api" | "contract";
type RegistryStatus = "Active" | "Deprecated" | "Replaced";
type Version = { major: number; minor: number; patch: number };
```

## Error Handling

App Registry functions throw `OmaTrustError` (extends `Error`) with a stable `code` property.

```ts
class OmaTrustError extends Error {
  code: string;
  details?: unknown;
}
```

| Code            | Thrown by                                        | Description                        |
| --------------- | ------------------------------------------------ | ---------------------------------- |
| `INVALID_INPUT` | All functions receiving malformed params         | Missing required fields, wrong types |
| `NETWORK_ERROR` | `computeDataHashFromUrl`, `verifyDataUrlHash`    | HTTP fetch failed or timed out     |

## Traits

- `hashTrait(trait: string): Hex`
- `hashTraits(traits: string[]): Hex[]`

## Interfaces

- `computeInterfacesBitmap(flags: InterfaceFlags): number`
- `parseBitmapToFlags(bitmap: number): InterfaceFlags`
- `hasInterface(bitmap: number, type: InterfaceType): boolean`
- `getInterfaceTypes(bitmap: number): InterfaceType[]`

## Status

- `registryCodeToStatus(code: number): RegistryStatus`
- `registryStatusToCode(status: RegistryStatus): number`
- `isValidRegistryStatus(status: string): boolean`

## Versioning

- `parseVersion(input: string): Version`
- `formatVersion(version: Version): string`
- `compareVersions(a: Version, b: Version): -1 | 0 | 1`
- `isVersionGreater(a: Version, b: Version): boolean`
- `isVersionEqual(a: Version, b: Version): boolean`
- `getLatestVersion(history: Version[]): Version`

## Data Hash

These functions compute and verify the `dataHash` metadata field for ERC-8004 app registry registrations. They fetch JSON from a URL, canonicalize it (JCS / RFC 8785), and hash it.

- `computeDataHashFromUrl(url: string, algorithm: "keccak256" | "sha256"): Promise<Hex>` — Fetch JSON from a URL, canonicalize it, and compute the hash.
- `verifyDataUrlHash(url: string, expectedHash: Hex, algorithm: "keccak256" | "sha256"): Promise<boolean>` — Fetch JSON from a URL and verify its canonicalized hash matches the expected value.

The `algorithm` parameter accepts `"keccak256"` or `"sha256"` string literals.

## Metadata Key Constants

These are the ERC-8004 `MetadataEntry` key strings used when calling `register()`. Exported as TypeScript constants so you don't need to hardcode strings.

| Constant                           | Value                      | Description                                          |
| ---------------------------------- | -------------------------- | ---------------------------------------------------- |
| `METADATA_KEY_DID`                 | `"omat.did"`               | DID string                                           |
| `METADATA_KEY_DID_HASH`            | `"omat.didHash"`           | DID hash (keccak256)                                 |
| `METADATA_KEY_DATA_HASH`           | `"omat.dataHash"`          | Data hash of off-chain JSON                          |
| `METADATA_KEY_DATA_HASH_ALGORITHM` | `"omat.dataHashAlgorithm"` | Hash algorithm (`"keccak256"` or `"sha256"`)         |
| `METADATA_KEY_STATUS`              | `"omat.status"`            | App status (0=Active, 1=Deprecated, 2=Replaced)      |
| `METADATA_KEY_INTERFACES`          | `"omat.interfaces"`        | Interface bitmap (1=human, 2=api, 4=smartContract)   |
| `METADATA_KEY_FUNGIBLE_TOKEN_ID`   | `"omat.fungibleTokenId"`   | CAIP-19 fungible token identifier                    |
| `METADATA_KEY_CONTRACT_ID`         | `"omat.contractId"`        | CAIP-10 contract address                             |
| `METADATA_KEY_VERSION_MAJOR`       | `"omat.versionMajor"`      | Major version number                                 |
| `METADATA_KEY_VERSION_MINOR`       | `"omat.versionMinor"`      | Minor version number                                 |
| `METADATA_KEY_VERSION_PATCH`       | `"omat.versionPatch"`      | Patch version number                                 |
| `METADATA_KEY_TRAIT_HASHES`        | `"omat.traitHashes"`       | Trait hashes (keccak256 of trait strings)             |
| `METADATA_KEY_METADATA_JSON`       | `"omat.metadataJson"`      | On-chain metadata JSON blob                          |

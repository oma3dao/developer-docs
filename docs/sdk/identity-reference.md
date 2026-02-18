---
sidebar_position: 5
---

# Identity SDK Reference

Canonical function reference for:

- `@oma3/omatrust/identity`

## Core Types

```ts
type Hex = `0x${string}`;
type Did = string;
type Caip10 = string;
```

## Error Handling

Identity functions throw `OmaTrustError` (extends `Error`) with a stable `code` property.

```ts
class OmaTrustError extends Error {
  code: string;
  details?: unknown;
}
```

| Code            | Thrown by                                                                                                                                                                 | Description                               |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `INVALID_INPUT` | All functions receiving malformed params                                                                                                                                  | Missing required fields, wrong types      |
| `INVALID_DID`   | `normalizeDid`, `normalizeDidWeb`, `normalizeDidPkh`, `normalizeDidHandle`, `normalizeDidKey`, `computeDidHash`, `didToAddress`, `validateDidAddress`, all `get*FromDid*` | String is not a valid DID or wrong method |
| `INVALID_CAIP`  | `parseCaip10`, `normalizeCaip10`, `parseCaip2`, `buildDidPkhFromCaip10`                                                                                                  | String is not a valid CAIP-10 or CAIP-2   |

## DID Utilities

Most developers should use `normalizeDid`, `didToAddress`, and the CAIP builders/parsers. All DID functions are pure local computation — no RPC calls.

### Validation

- `isValidDid(did: string): boolean` — Check if a string matches the basic DID format (`did:method:identifier`). Does not validate method-specific rules.
- `extractDidMethod(did: Did): string` — Extract the method from a DID (e.g., `"web"` from `"did:web:example.com"`). Returns `null` if not a valid DID.
- `extractDidIdentifier(did: Did): string` — Extract the identifier portion (e.g., `"example.com"` from `"did:web:example.com"`). Returns `null` if not a valid DID.

### Normalization

- `normalizeDid(input: string): Did` — Normalize any DID to its canonical form. Routes to the appropriate method-specific normalizer. Bare domains (no `did:` prefix) are treated as `did:web`. Throws `INVALID_DID` for malformed input.
- `normalizeDidWeb(input: string): Did` — Normalize a `did:web` DID. Lowercases the host, preserves path case. Throws `INVALID_DID` if input is a non-web DID method.
- `normalizeDidPkh(input: string): Did` — Normalize a `did:pkh` DID. Lowercases the address component per CAIP-10 canonical form. Expects format `did:pkh:namespace:chainId:address`. Throws `INVALID_DID`.
- `normalizeDidHandle(input: string): Did` — Normalize a `did:handle` DID. Lowercases the platform, preserves username case (platform-defined). Expects format `did:handle:platform:username`. Throws `INVALID_DID`.
- `normalizeDidKey(input: string): Did` — Normalize a `did:key` DID. Returns as-is (multibase encoding is case-sensitive). Throws `INVALID_DID`.
- `normalizeDomain(domain: string): string` — Normalize a domain name: lowercase, strip trailing dot.

### Hashing and Address

- `computeDidHash(did: Did): Hex` — Compute the keccak256 hash of a normalized DID. Normalizes the DID first, then hashes the UTF-8 bytes. Returns a 32-byte hex string. Throws `INVALID_DID`.
- `computeDidAddress(didHash: Hex): Hex` — Compute a DID Address from a DID hash by taking the last 20 bytes (simple truncation per OMATrust spec §5.3.2). Returns lowercase `0x`-prefixed hex (no EIP-55 checksum casing). This is not a real wallet address — it's a derived lookup key for EAS attestation indexing.
- `didToAddress(did: Did): Hex` — Convenience: normalize a DID, hash it, and return the DID Address in one call (lowercase `0x`-prefixed hex). Throws `INVALID_DID`.
- `validateDidAddress(did: Did, address: Hex): boolean` — Verify that a DID Address was computed correctly for a given DID. Returns `false` on any error.

### DID Builders

- `buildDidWeb(domain: string): Did` — Build a `did:web` DID from a domain name (e.g., `"example.com"` → `"did:web:example.com"`). Normalizes the domain.
- `buildDidPkh(namespace: string, chainId: string | number, address: string): Did` — Build a `did:pkh` DID from components (e.g., `"eip155"`, `1`, `"0x..."` → `"did:pkh:eip155:1:0x..."`). Lowercases the address.
- `buildEvmDidPkh(chainId: string | number, address: string): Did` — Convenience: build a `did:pkh` with `eip155` namespace.
- `buildDidPkhFromCaip10(caip10: Caip10): Did` — Build a `did:pkh` from a CAIP-10 string (e.g., `"eip155:1:0x..."` → `"did:pkh:eip155:1:0x..."`). Throws `INVALID_CAIP`.

### DID Parsers

- `getChainIdFromDidPkh(did: Did): string` — Extract the chain ID from a `did:pkh` DID. Returns `null` if not a valid `did:pkh`. Returns the CAIP chain reference as a `string`; parse to `number` only for EVM (`eip155`) contexts.

  ```ts
  const chainRef = getChainIdFromDidPkh(did);
  const chainId = Number(chainRef); // EVM-only
  ```

- `getAddressFromDidPkh(did: Did): string` — Extract the address from a `did:pkh` DID. Returns `null` if not a valid `did:pkh`.
- `getNamespaceFromDidPkh(did: Did): string` — Extract the namespace (e.g., `"eip155"`) from a `did:pkh` DID. Returns `null` if not a valid `did:pkh`.
- `isEvmDidPkh(did: Did): boolean` — Check if a `did:pkh` DID uses the `eip155` (EVM) namespace.
- `getDomainFromDidWeb(did: Did): string` — Extract the domain from a `did:web` DID (e.g., `"did:web:example.com/path"` → `"example.com"`). Returns `null` if not a valid `did:web`.
- `extractAddressFromDid(identifier: string): string` — Extract an Ethereum address from a DID, CAIP-10 string, or raw address. Handles `did:pkh`, CAIP-10, and plain `0x` addresses.

## CAIP Utilities

[CAIP-10](https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-10.md) identifies a blockchain account as `namespace:reference:address` (e.g., `eip155:1:0x...`). [CAIP-2](https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-2.md) identifies a chain as `namespace:reference` (e.g., `eip155:1`).

- `parseCaip10(input: string): { namespace: string; reference: string; address: string }` — Parse a CAIP-10 string into its three components. Throws `INVALID_CAIP` if the format is invalid.
- `buildCaip10(namespace: string, reference: string, address: string): Caip10` — Build a CAIP-10 string from components.
- `normalizeCaip10(input: string): Caip10` — Parse, validate, and normalize a CAIP-10 string. Lowercases the address for EVM namespaces. Throws `INVALID_CAIP`.
- `buildCaip2(namespace: string, reference: string): string` — Build a CAIP-2 chain identifier string.
- `parseCaip2(caip2: string): { namespace: string; reference: string }` — Parse a CAIP-2 string into namespace and reference. Throws `INVALID_CAIP`.

## Data Utilities

These functions handle JSON canonicalization (JCS / RFC 8785). They are used in proof seed construction (`constructSeed` in the reputation module).

- `canonicalizeJson(obj: unknown): string` — JCS canonicalize any JSON-serializable object.
- `canonicalizeForHash(obj: unknown): { jcsJson: string; hash: Hex }` — Canonicalize and return both the JCS string and its keccak256 hash.

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
- `normalizeDidWeb(input: string): Did` — Normalize a `did:web` DID. Lowercases the host, strips a leading `www.`, removes a trailing `.`, and preserves path case. Throws `INVALID_DID` if input is a non-web DID method.
- `normalizeDidPkh(input: string): Did` — Normalize a `did:pkh` DID. Lowercases the address component per CAIP-10 canonical form. Expects format `did:pkh:namespace:chainId:address`. Throws `INVALID_DID`.
- `normalizeDidHandle(input: string): Did` — Normalize a `did:handle` DID. Lowercases the platform, preserves username case (platform-defined). Expects format `did:handle:platform:username`. Throws `INVALID_DID`.
- `normalizeDidKey(input: string): Did` — Normalize a `did:key` DID. Returns as-is (multibase encoding is case-sensitive). Throws `INVALID_DID`.
- `normalizeDomain(domain: string): string` — Normalize a domain name: lowercase, strip trailing dot, strip leading `www.`.

### Hashing and Address

- `computeDidHash(did: Did): Hex` — Compute the keccak256 hash of a normalized DID. Normalizes the DID first, then hashes the UTF-8 bytes. For `did:web`, this uses the canonical hostname form, so `did:web:www.example.com` and `did:web:example.com` hash identically. Returns a 32-byte hex string. Throws `INVALID_DID`.
- `computeDidAddress(didHash: Hex): Hex` — Compute a [DID Address](/start-here/definitions#did-address) from a DID hash by taking the last 20 bytes (simple truncation per OMATrust spec §5.3.2). Returns lowercase `0x`-prefixed hex (no EIP-55 checksum casing). This is not a real wallet address — it's a derived lookup key for EAS attestation indexing.
- `didToAddress(did: Did): Hex` — Convenience: normalize a DID, hash it, and return the [DID Address](/start-here/definitions#did-address) in one call (lowercase `0x`-prefixed hex). For `did:web`, the canonical hostname form strips a leading `www.` before hashing. Throws `INVALID_DID`.
- `validateDidAddress(did: Did, address: Hex): boolean` — Verify that a [DID Address](/start-here/definitions#did-address) was computed correctly for a given DID. Returns `false` on any error.

### DID Builders

- `buildDidWeb(domain: string): Did` — Build a `did:web` DID from a domain name (e.g., `"example.com"` → `"did:web:example.com"`). Normalizes the domain, including stripping a leading `www.`.
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

## DID URL Parsing

DID URLs are DIDs with a fragment (e.g., `did:web:api.example.com#key-1`). They are mutable key references — see [Definitions: DID URL vs Controller DID](/start-here/definitions#did-url-vs-controller-did).

### `parseDidUrl(input)`

```ts
type ParsedDidUrl = {
  didUrl: string;
  did: string;
  fragment: string;
};
function parseDidUrl(input: string): ParsedDidUrl;
```

- Purpose: Parse a DID URL into its components.
- Example: `did:web:api.example.com#key-1` → `{ didUrl: "did:web:api.example.com#key-1", did: "did:web:api.example.com", fragment: "key-1" }`
- Throws: `INVALID_DID_URL` for malformed input or empty fragments.

### `isDidUrl(input)`

```ts
function isDidUrl(input: string): boolean;
```

- Purpose: Returns `true` if the string is a DID URL (has a `#` fragment with a valid base DID).

### `assertBareDid(input)`

```ts
function assertBareDid(input: string): void;
```

- Purpose: Throws if the input is a DID URL. Use in functions that expect a bare subject DID and must reject DID URLs.
- Throws: `INVALID_DID_URL`

## JWK Helpers

Functions for working with JSON Web Keys (JWKs) and `did:jwk` DIDs. Used for non-EVM controller identities.

### `validatePublicJwk(jwk)`

```ts
type JwkValidationResult = {
  valid: boolean;
  reason?: string;
};
function validatePublicJwk(jwk: unknown): JwkValidationResult;
```

- Purpose: Validate that a JWK is a well-formed public key.
- Checks `kty` (EC, OKP, RSA), required fields per key type, and rejects private key material (`d`, `p`, `q`, etc.).

### `jwkToDidJwk(jwk)`

```ts
function jwkToDidJwk(jwk: unknown): string;
```

- Purpose: Convert a public JWK to a `did:jwk` DID.
- Uses deterministic (sorted-key) JSON + base64url encoding.
- Rejects private key material.
- Throws: `INVALID_INPUT`

### `didJwkToJwk(didJwk)`

```ts
type PublicJwk = Record<string, unknown>;
function didJwkToJwk(didJwk: string): PublicJwk;
```

- Purpose: Convert a `did:jwk` DID back to a public JWK object.
- Validates the result.
- Throws: `INVALID_DID`

### `publicJwkEquals(a, b)`

```ts
function publicJwkEquals(a: unknown, b: unknown): boolean;
```

- Purpose: Compare two public JWKs for equality.
- Ignores property order and metadata fields (`kid`, `use`, `alg`, `key_ops`, `ext`).
- Throws if either contains private key material.

### `computeJwkThumbprint(jwk, algorithm?)`

```ts
function computeJwkThumbprint(
  jwk: unknown,
  algorithm?: "sha256" | "sha384" | "sha512"
): Promise<string>;
```

- Purpose: Compute an RFC 7638 JWK Thumbprint.
- Returns: base64url-encoded hash.
- Default algorithm: `"sha256"`.

### `formatJktValue(jwk)`

```ts
function formatJktValue(jwk: unknown): Promise<string>;
```

- Purpose: Returns `jkt=S256:<thumbprint>` format for DNS TXT records.

## DID URL Key Resolution

Resolve DID URLs to their underlying public key material and derive durable controller DIDs.

### `resolveDidUrlToPublicKey(didUrl, options?)`

```ts
type ResolvedPublicKey = {
  didUrl: string;
  did: string;
  fragment: string;
  publicKeyJwk: Record<string, unknown>;
  verificationMethodId: string;
};
function resolveDidUrlToPublicKey(
  didUrl: string,
  options?: { fetchDidDocument?: (domain: string) => Promise<Record<string, unknown>> }
): Promise<ResolvedPublicKey>;
```

- Purpose: Resolve a DID URL (e.g., `did:web:api.example.com#key-1`) to public key material.
- Fetches the DID document, finds the matching verification method, extracts and validates `publicKeyJwk`.
- Currently supports `did:web`.
- Throws: `INVALID_DID_URL`, `NETWORK_ERROR`

### `resolveDidUrlToControllerDid(didUrl, options?)`

```ts
type ResolvedControllerDid = {
  didUrl: string;
  did: string;
  fragment: string;
  publicKeyJwk: Record<string, unknown>;
  verificationMethodId: string;
  controllerDid: string;
};
function resolveDidUrlToControllerDid(
  didUrl: string,
  options?: { fetchDidDocument?: (domain: string) => Promise<Record<string, unknown>> }
): Promise<ResolvedControllerDid>;
```

- Purpose: Wraps `resolveDidUrlToPublicKey` and derives a durable `did:jwk` controller DID from the resolved key.
- The `controllerDid` is what callers should pass to `getControllerAuthorization`. DID URLs are mutable key references — the derived `did:jwk` is the immutable controller identity.
- Throws: `INVALID_DID_URL`, `NETWORK_ERROR`

## Controller ID Comparison

Functions for comparing controller DIDs across different formats and chains.

### `isSameControllerId(a, b)`

```ts
function isSameControllerId(a: string, b: string): boolean;
```

- Purpose: Check if two controller DIDs refer to the same entity.
- Three matching strategies:
  1. Exact normalized DID string match
  2. EVM address match (chain-agnostic) — `did:pkh:eip155:1:0xABC` matches `did:pkh:eip155:137:0xABC`
  3. JWK material match — two `did:jwk` with the same key material but different encodings

### `extractControllerEvmAddress(controllerDid)`

```ts
function extractControllerEvmAddress(controllerDid: string): string | null;
```

- Purpose: Extract the EVM address from a `did:pkh:eip155:*` DID.
- Returns `null` for non-EVM controllers (`did:jwk`, non-eip155 `did:pkh`, etc.).

## Authorization Metadata

### `extractAuthorizationMetadata(result)`

```ts
type JwsVerificationResult = {
  publicKeyDid: string;
  resourceUrl?: string;
  issuedAt?: number;
  kid?: string;
  publicKeyJwk?: Record<string, unknown>;
};

type AuthorizationMetadata = {
  controllerDid: string;
  subjectDid: string;
  resourceUrl: string;
  issuedAt: number;
  kid: string;
  publicKeyJwk: Record<string, unknown>;
};

function extractAuthorizationMetadata(result: JwsVerificationResult): AuthorizationMetadata;
```

- Purpose: Extract the metadata needed for a `getControllerAuthorization` call from a JWS verification result.
- Derives `subjectDid` from `resourceUrl` (assumes `did:web` for HTTPS URLs).
- Returns `{ controllerDid, subjectDid, resourceUrl, issuedAt, kid, publicKeyJwk }`.

## Data Utilities

These functions handle JSON canonicalization (JCS / RFC 8785). They are used in proof seed construction (`constructSeed` in the reputation module).

- `canonicalizeJson(obj: unknown): string` — JCS canonicalize any JSON-serializable object.
- `canonicalizeForHash(obj: unknown): { jcsJson: string; hash: Hex }` — Canonicalize and return both the JCS string and its keccak256 hash.

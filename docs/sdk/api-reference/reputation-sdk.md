---
sidebar_position: 4
---

# Reputation SDK Reference

Canonical function reference for:

- `@oma3/omatrust/reputation`

This is the implementation contract for reputation workflows, including attestation submission, querying, verification, proof functions, and the controller witness API client.

For end-to-end workflow guides covering proof lifecycles, see the [Attestations Guide](/reputation/attestation-types) and the [OMATrust Specification](https://github.com/oma3dao/omatrust-docs).

## High-Level vs Advanced APIs

Most developers should start with the high-level functions:

- `submitAttestation`
- `prepareDelegatedAttestation`
- `submitDelegatedAttestation`
- `getAttestation`
- `listAttestations`
- `verifyAttestation`
- `callControllerWitness`

Advanced functions below are optional and intended for custom verifiers, specialized relays, and low-level integrations.

## Core Types

```ts
type Hex = `0x${string}`;
type Did = string;

// All proof types defined in the OMATrust Proof Specification (§5.3)
type ProofType =
  | "pop-jws"            // JWS signature proof (§5.3.2)
  | "pop-eip712"         // EIP-712 typed data signature proof (§5.3.3)
  | "x402-receipt"       // x402 service receipt proof (§5.3.4)
  | "evidence-pointer"   // URL-based evidence pointer (§5.3.5)
  | "tx-encoded-value"   // Deterministic transfer amount proof (§5.3.6)
  | "tx-interaction"     // On-chain contract interaction proof (§5.3.7)
  | "x402-offer";        // x402 signed offer proof (§5.3.8)

type ProofPurpose = "shared-control" | "commercial-tx";

type SchemaField = { name: string; type: string; value?: unknown };

type AttestationQueryResult = {
  uid: Hex;
  schema: Hex;
  attester: Hex;
  recipient: Hex;
  revocable: boolean;
  revocationTime: bigint;
  expirationTime: bigint;
  time: bigint;
  refUID: Hex;
  data: Record<string, unknown>;
  raw?: string;
};

// OMATrust Proof wrapper (§5.3.1). All proofs share this envelope.
type ProofWrapper = {
  proofType: ProofType;
  proofObject: unknown;          // Native proof object, shape depends on proofType
  proofPurpose?: ProofPurpose;
  version?: number;              // Default 1
  issuedAt?: number;             // Unix timestamp
  expiresAt?: number;            // Unix timestamp
};

// Proof wrapper with typed proofObject for tx-encoded-value (§5.3.6)
type TxEncodedValueProof = ProofWrapper & {
  proofType: "tx-encoded-value";
  proofPurpose: ProofPurpose;
  proofObject: {
    chainId: string;
    txHash: string;
  };
};

// Proof wrapper with typed proofObject for tx-interaction (§5.3.7)
type TxInteractionProof = ProofWrapper & {
  proofType: "tx-interaction";
  proofPurpose: "commercial-tx";
  proofObject: {
    chainId: string;
    txHash: string;
  };
};

// Proof wrapper with typed proofObject for pop-eip712 (§5.3.3)
type PopEip712Proof = ProofWrapper & {
  proofType: "pop-eip712";
  proofObject: {
    domain: { name: string; version: string; chainId: number };
    message: {
      signer: string;
      authorizedEntity: string;
      signingPurpose: string;
      creationTimestamp: number;
      expirationTimestamp: number;
      randomValue: Hex;
      statement: string;
    };
    signature: Hex;
  };
};

// Proof wrapper with typed proofObject for pop-jws (§5.3.2)
type PopJwsProof = ProofWrapper & {
  proofType: "pop-jws";
  proofObject: string;           // Compact JWS string
};

// Proof wrapper with typed proofObject for x402-receipt (§5.3.4)
type X402ReceiptProof = ProofWrapper & {
  proofType: "x402-receipt";
  proofPurpose: "commercial-tx";
  proofObject: Record<string, unknown>;  // x402 receipt per x402 spec
};

// Proof wrapper with typed proofObject for x402-offer (§5.3.8)
type X402OfferProof = ProofWrapper & {
  proofType: "x402-offer";
  proofPurpose: "commercial-tx";
  proofObject: Record<string, unknown>;  // x402 signed offer per x402 spec
};

// Proof wrapper with typed proofObject for evidence-pointer (§5.3.5)
type EvidencePointerProof = ProofWrapper & {
  proofType: "evidence-pointer";
  proofPurpose: "shared-control";
  proofObject: {
    url: string;
  };
};

type ChainConstants = {
  base: bigint;
  range: bigint;
  decimals: number;
  nativeSymbol: string;
};
```

## Error Handling

All functions throw `OmaTrustError` (extends `Error`) with a stable `code` property. Consumers can catch and switch on `error.code`.

```ts
class OmaTrustError extends Error {
  code: string;
  details?: unknown;
}
```

| Code                         | Thrown by                                                    | Description                                          |
| ---------------------------- | ------------------------------------------------------------ | ---------------------------------------------------- |
| `INVALID_INPUT`              | All functions receiving malformed params                     | Missing required fields, wrong types, empty strings  |
| `SCHEMA_NOT_FOUND`           | `verifySchemaExists`, `getSchemaDetails`                     | Schema UID does not exist on-chain                   |
| `ATTESTATION_NOT_FOUND`      | `getAttestation`                                             | Attestation UID does not exist or has been revoked   |
| `PROOF_VERIFICATION_FAILED`  | `verifyAttestation`, `verifyProof`                           | One or more proof checks failed                      |
| `NETWORK_ERROR`              | Any function making RPC or HTTP requests                     | Provider unreachable, timeout, HTTP error             |
| `UNSUPPORTED_CHAIN`          | `calculateTransferAmount`, `getChainConstants`, `hashSeed`   | Chain ID not in supported set                        |

```ts
import { submitAttestation } from "@oma3/omatrust/reputation";

try {
  await submitAttestation(params);
} catch (err) {
  if (err.code === "NETWORK_ERROR") {
    // retry or switch RPC
  }
}
```

## Functions

### `submitAttestation(params)`

```ts
type SubmitAttestationParams = {
  signer: unknown;              // ethers v6 Signer
  chainId: number;
  easContractAddress: Hex;
  schemaUid: Hex;
  schema: SchemaField[] | string;
  data: Record<string, unknown>;
  revocable?: boolean;
  expirationTime?: bigint | number;
  refUid?: Hex;
  value?: bigint | number;
};
type SubmitAttestationResult = { uid: Hex; txHash: Hex; receipt?: unknown };
function submitAttestation(params: SubmitAttestationParams): Promise<SubmitAttestationResult>;
```

- Purpose: Submit a direct attestation on-chain.
- The `schema` field accepts either an array of `SchemaField` objects or an EAS schema string (e.g., `"string subject, uint8 rating, string comment"`).
- The `data` object keys must match the `name` fields in the schema.
- If the schema includes a `subjectDidHash` field and `data` contains a `subject` DID string, the hash is auto-computed. You do not need to hash it yourself.
- Throws: `INVALID_INPUT`, `NETWORK_ERROR`

### `prepareDelegatedAttestation(params)`

```ts
type PrepareDelegatedAttestationParams = {
  chainId: number;
  easContractAddress: Hex;
  schemaUid: Hex;
  schema: SchemaField[] | string;
  data: Record<string, unknown>;
  attester: Hex;
  nonce: bigint | number;
  revocable?: boolean;
  expirationTime?: bigint | number;
  refUid?: Hex;
  value?: bigint | number;
  deadline?: bigint | number;
};
type PrepareDelegatedAttestationResult = {
  delegatedRequest: Record<string, unknown>;
  typedData: {
    domain: Record<string, unknown>;
    types: Record<string, unknown>;
    message: Record<string, unknown>;
  };
};
function prepareDelegatedAttestation(params: PrepareDelegatedAttestationParams): Promise<PrepareDelegatedAttestationResult>;
```

- Purpose: Build delegated attestation payload + EIP-712 typed data for signing.
- Same `schema`/`data` semantics as `submitAttestation` (including auto `subjectDidHash`).
- The returned `typedData` is passed directly to `signer.signTypedData(domain, types, message)`.
- Throws: `INVALID_INPUT`

### `submitDelegatedAttestation(params)`

```ts
type SubmitDelegatedAttestationParams = {
  relayUrl: string;
  prepared: PrepareDelegatedAttestationResult;
  signature: Hex | string;
  attester?: Hex;
};
type SubmitDelegatedAttestationResult = { uid: Hex; txHash?: Hex; status: "submitted" | "confirmed" };
function submitDelegatedAttestation(params: SubmitDelegatedAttestationParams): Promise<SubmitDelegatedAttestationResult>;
```

- Purpose: Submit a signed delegated attestation via relay/gateway.
- The `relayUrl` is the endpoint that accepts delegated attestation payloads (e.g., your API route or a shared gateway). See the [Delegated Attestation API](/api/delegated-attestation) for the relay contract.
- Throws: `INVALID_INPUT`, `NETWORK_ERROR`

### `getAttestation(params)`

```ts
type GetAttestationParams = {
  uid: Hex;
  provider: unknown;             // ethers v6 Provider
  easContractAddress: Hex;
  schema?: SchemaField[] | string;
};
function getAttestation(params: GetAttestationParams): Promise<AttestationQueryResult>;
```

- Purpose: Read and decode one attestation by UID.
- If `schema` is provided, the raw attestation data is decoded into the `data` field of the result. Otherwise `data` will be empty and `raw` will contain the encoded bytes.
- Throws: `ATTESTATION_NOT_FOUND`, `NETWORK_ERROR`

### `listAttestations(params)`

```ts
type ListAttestationsParams = {
  did: Did;
  provider: unknown;             // ethers v6 Provider
  easContractAddress: Hex;
  schemas?: Hex[];
  limit?: number;
  fromBlock?: number;
  toBlock?: number;
};
function listAttestations(params: ListAttestationsParams): Promise<AttestationQueryResult[]>;
```

- Purpose: Query attestations by subject DID and optional filters.
- Computes the DID hash internally to query on-chain.
- Throws: `INVALID_INPUT`, `NETWORK_ERROR`

### `verifyAttestation(params)`

```ts
type VerifyAttestationParams = {
  attestation: AttestationQueryResult;
  provider?: unknown;            // ethers v6 Provider (required for on-chain checks)
  checks?: ProofType[];          // Which proof types to verify; omit to verify all present
  context?: Record<string, unknown>;
};
type VerifyAttestationResult = {
  valid: boolean;
  checks: Record<string, boolean>;
  reasons: string[];
};
function verifyAttestation(params: VerifyAttestationParams): Promise<VerifyAttestationResult>;
```

- Purpose: Verify attestation validity plus proof checks.
- If `checks` is omitted, runs all applicable checks based on the proof types present in the attestation's `proofs` array.
- `reasons` contains human-readable explanations for any failed checks.
- Throws: `PROOF_VERIFICATION_FAILED`, `NETWORK_ERROR`

### `callControllerWitness(params)`

```ts
type CallControllerWitnessParams = {
  gatewayUrl: string;
  attestationUid: Hex;
  chainId: number;
  easContract: Hex;
  schemaUid: Hex;
  subject: Did;
  controller: Did;
  timeoutMs?: number;
};
type CallControllerWitnessResult = {
  ok: boolean;
  method: "dns-txt" | "did-json";
  details?: unknown;
};
function callControllerWitness(params: CallControllerWitnessParams): Promise<CallControllerWitnessResult>;
```

- Purpose: Call controller witness endpoint with automatic fallback (tries `dns-txt` first, falls back to `did-json`).
- The `gatewayUrl` is passed in by the consumer — not hardcoded. You decide whether to call your own API route or a shared gateway. See the [Controller Witness API](/api/controller-witness) for the raw endpoint contract.
- Typically called after `submitAttestation` or `submitDelegatedAttestation` completes.
- Throws: `NETWORK_ERROR`

## Advanced Attestation Functions

### `encodeAttestationData(schema, data)`

```ts
function encodeAttestationData(
  schema: SchemaField[] | string,
  data: Record<string, unknown>
): Hex;
```

- Purpose: ABI-encode attestation data using the EAS `SchemaEncoder`. This is what gets stored on-chain as the attestation's `data` field.
- The `schema` parameter accepts either a `SchemaField[]` array or an EAS schema string (e.g., `"string subject, uint8 rating"`).
- The `data` object keys must match the schema field names exactly.
- Returns: ABI-encoded bytes as a hex string.
- Used internally by `submitAttestation` and `prepareDelegatedAttestation`. Call this directly only if you're building custom submission logic.
- Throws: `INVALID_INPUT`

### `decodeAttestationData(schema, encodedData)`

```ts
function decodeAttestationData(
  schema: SchemaField[] | string,
  encodedData: Hex
): Record<string, unknown>;
```

- Purpose: Decode ABI-encoded attestation bytes back into a typed object.
- Returns: Object keyed by schema field names with decoded values (e.g., `{ subject: "did:web:example.com", rating: 5n }`).
- Used internally by `getAttestation` when `schema` is provided. Call this directly if you have raw attestation bytes and need to decode them separately.
- Throws: `INVALID_INPUT`

### `extractExpirationTime(data)`

```ts
function extractExpirationTime(
  data: Record<string, unknown>
): bigint | number | undefined;
```

- Purpose: Extract expiration timestamp from attestation data fields. Looks for common field names (`expirationTime`, `expiration`, `validUntil`).
- Returns: Timestamp as `bigint` or `number`, or `undefined` if no expiration field is found.

### `buildDelegatedAttestationTypedData(params)`

```ts
function buildDelegatedAttestationTypedData(
  params: PrepareDelegatedAttestationParams
): { domain: Record<string, unknown>; types: Record<string, unknown>; message: Record<string, unknown> };
```

- Purpose: Build EIP-712 typed data for delegated attestation signing. This is the lower-level building block used by `prepareDelegatedAttestation`.
- Call this directly only if you need the typed data without the full `delegatedRequest` wrapper.
- Throws: `INVALID_INPUT`

### `splitSignature(signature)`

```ts
function splitSignature(
  signature: Hex | string
): { v: number; r: Hex; s: Hex };
```

- Purpose: Split a 65-byte signature into `{v, r, s}` components for EAS contract calls.
- Throws: `INVALID_INPUT`

### `getAttestationsForDid(params)`

```ts
function getAttestationsForDid(
  params: ListAttestationsParams
): Promise<AttestationQueryResult[]>;
```

- Purpose: Low-level DID subject query helper. Same as `listAttestations` but without deduplication or sorting. Use `listAttestations` unless you need raw results.
- Throws: `NETWORK_ERROR`

### `getLatestAttestations(params)`

```ts
type GetLatestAttestationsParams = {
  provider: unknown;
  easContractAddress: Hex;
  schemas?: Hex[];
  limit?: number;
  fromBlock?: number;
};
function getLatestAttestations(
  params: GetLatestAttestationsParams
): Promise<AttestationQueryResult[]>;
```

- Purpose: Fetch the most recent attestations across schemas, not filtered by subject. Useful for dashboards and monitoring.
- Throws: `NETWORK_ERROR`

### `deduplicateReviews(attestations)`

```ts
function deduplicateReviews(
  attestations: AttestationQueryResult[]
): AttestationQueryResult[];
```

- Purpose: Deduplicate User Review attestations by attester + subject + major version. When the same attester reviews the same subject multiple times, only the latest attestation (by timestamp) is kept. This implements the OMATrust supersession logic defined in the Reputation Specification §7.1.4.

### `calculateAverageUserReviewRating(attestations)`

```ts
function calculateAverageUserReviewRating(
  attestations: AttestationQueryResult[]
): number;
```

- Purpose: Calculate the average `ratingValue` field across an array of User Review attestations. This function is specific to the User Review schema (Reputation Specification §7.1) and expects each attestation's `data` to contain a numeric `ratingValue` field (1–5).
- Returns: Average as a floating-point number.

### `getMajorVersion(version)`

```ts
function getMajorVersion(version: string): number;
```

- Purpose: Extract the major version number from a semver string (e.g., `"2.1.0"` → `2`).

### `verifySchemaExists(schemaRegistry, schemaUid)`

```ts
function verifySchemaExists(
  schemaRegistry: unknown,
  schemaUid: Hex
): Promise<boolean>;
```

- Purpose: Check if a schema UID exists in the EAS SchemaRegistry contract.
- The `schemaRegistry` parameter is an EAS SDK `SchemaRegistry` instance, created via `new SchemaRegistry(address)` from `@ethereum-attestation-service/eas-sdk`. The SchemaRegistry is the on-chain contract that stores all registered attestation schemas — each schema gets a unique UID when registered, and this function checks whether a given UID exists.
- Throws: `NETWORK_ERROR`

### `getSchemaDetails(schemaRegistry, schemaUid)`

```ts
function getSchemaDetails(
  schemaRegistry: unknown,
  schemaUid: Hex
): Promise<{ uid: Hex; schema: string; resolver: Hex; revocable: boolean }>;
```

- Purpose: Fetch the full schema record from the EAS SchemaRegistry contract.
- Returns: Schema record with the schema string (e.g., `"string subject, uint8 rating"`), resolver address, and revocability flag.
- Throws: `SCHEMA_NOT_FOUND`, `NETWORK_ERROR`

### `formatSchemaUid(schemaUid)`

```ts
function formatSchemaUid(schemaUid: string): Hex;
```

- Purpose: Ensure a schema UID has the `0x` prefix and is lowercase. Normalizes inconsistent formatting.

## Advanced Proof Functions

The OMATrust Proof Specification defines seven proof types. This section provides SDK functions for creating and verifying each type. For the full proof specification, see the [OMATrust Proof Specification](https://github.com/oma3dao/omatrust-docs/blob/main/specification/omatrust-specification-proofs.md).

### Proof Creation

#### `createTxEncodedValueProof(chainId, txHash, purpose)`

```ts
function createTxEncodedValueProof(
  chainId: number,
  txHash: Hex,
  purpose: ProofPurpose
): TxEncodedValueProof;
```

- Purpose: Build a `tx-encoded-value` proof wrapper from a completed native-value transaction (§5.3.6).

#### `createTxInteractionProof(chainId, txHash)`

```ts
function createTxInteractionProof(
  chainId: number,
  txHash: Hex
): TxInteractionProof;
```

- Purpose: Build a `tx-interaction` proof wrapper from a completed smart contract transaction (§5.3.7). Used when a reviewer interacted with a contract-based service.

#### `createPopEip712Proof(params)`

```ts
type CreatePopEip712ProofParams = {
  signer: string;                // Subject address (the signer)
  authorizedEntity: string;      // Controller DID
  signingPurpose: ProofPurpose;
  chainId: number;
  creationTimestamp?: number;
  expirationTimestamp?: number;
  randomValue?: Hex;
  statement?: string;            // Defaults to "This is not a transaction or asset approval."
};
function createPopEip712Proof(
  params: CreatePopEip712ProofParams,
  signFn: (typedData: Record<string, unknown>) => Promise<Hex>
): Promise<PopEip712Proof>;
```

- Purpose: Build a `pop-eip712` proof by constructing the canonical OMATrust EIP-712 typed data (§5.3.3) and signing it with the provided signing function.
- The `signFn` callback receives the full EIP-712 typed data and should return the signature. This keeps the SDK signer-agnostic — you can use ethers, viem, or any wallet.
- Throws: `INVALID_INPUT`

#### `createPopJwsProof(params)`

```ts
type CreatePopJwsProofParams = {
  issuer: Did;                   // Subject DID
  audience: Did;                 // Controller DID
  purpose: ProofPurpose;
  issuedAt?: number;
  expiresAt?: number;
  nonce?: string;
};
function createPopJwsProof(
  params: CreatePopJwsProofParams,
  signFn: (payload: Record<string, unknown>, header: Record<string, unknown>) => Promise<string>
): Promise<PopJwsProof>;
```

- Purpose: Build a `pop-jws` proof by constructing the JWS payload and header per §5.3.2 and signing with the provided callback.
- The `signFn` receives the JWS payload and header objects and should return the compact JWS string.
- Throws: `INVALID_INPUT`

#### `createEvidencePointerProof(url)`

```ts
function createEvidencePointerProof(
  url: string
): EvidencePointerProof;
```

- Purpose: Build an `evidence-pointer` proof wrapper pointing to a publicly accessible URL containing evidence (§5.3.5). The URL should resolve to either an embedded cryptographic proof or a handle-link statement in `v=1;controller=<DID>` format.

#### `createX402ReceiptProof(receipt)`

```ts
function createX402ReceiptProof(
  receipt: Record<string, unknown>
): X402ReceiptProof;
```

- Purpose: Build an `x402-receipt` proof wrapper from an x402 service receipt object (§5.3.4). The receipt is the object from `extensions["offer-receipt"].info.receipt` in an x402 Settlement Response.

#### `createX402OfferProof(offer)`

```ts
function createX402OfferProof(
  offer: Record<string, unknown>
): X402OfferProof;
```

- Purpose: Build an `x402-offer` proof wrapper from an x402 signed offer object (§5.3.8). The offer is from `extensions["offer-receipt"].info.offers[*]` in an x402 Payment Requirements response.

### Proof Verification

#### `verifyProof(proof, context)`

```ts
type VerifyProofParams = {
  proof: ProofWrapper;
  provider?: unknown;            // ethers v6 Provider (required for on-chain proofs)
  expectedSubject?: Did;
  expectedController?: Did;
};
type VerifyProofResult = {
  valid: boolean;
  proofType: ProofType;
  reason?: string;
};
function verifyProof(
  params: VerifyProofParams
): Promise<VerifyProofResult>;
```

- Purpose: Verify a single proof wrapper of any type. Routes to the appropriate type-specific verification logic based on `proof.proofType`.
- For `tx-encoded-value`: fetches the on-chain transaction and checks the transfer amount matches the deterministic value.
- For `tx-interaction`: fetches the transaction and confirms sender/recipient match the expected attester/subject.
- For `pop-eip712`: recovers the signer from the EIP-712 signature and validates against the canonical OMATrust schema.
- For `pop-jws`: validates the JWS signature against the embedded JWK and checks claims.
- For `x402-receipt`: validates the receipt per the x402 Signed Offer and Service Receipt Extension spec.
- For `x402-offer`: validates the offer per the x402 spec.
- For `evidence-pointer`: fetches the URL and validates the evidence artifact (embedded crypto proof or handle-link statement).
- Throws: `PROOF_VERIFICATION_FAILED`, `NETWORK_ERROR`

### tx-encoded-value Helpers

#### `calculateTransferAmount(subject, counterparty, chainId, purpose)`

```ts
function calculateTransferAmount(
  subject: Did,
  counterparty: Did,
  chainId: number,
  purpose: ProofPurpose
): bigint;
```

- Purpose: Compute the deterministic transfer amount for a tx-encoded-value proof (§5.3.6).
- The amount is derived from the DID hashes of both parties, the chain ID, and the proof purpose. It is deterministic — the same inputs always produce the same amount.
- Returns: Amount in the chain's smallest unit (e.g., wei for EVM chains).
- Throws: `INVALID_INPUT`, `UNSUPPORTED_CHAIN`

#### `calculateTransferAmountFromAddresses(subjectAddress, counterpartyAddress, chainId, purpose)`

```ts
function calculateTransferAmountFromAddresses(
  subjectAddress: string,
  counterpartyAddress: string,
  chainId: number,
  purpose: ProofPurpose
): bigint;
```

- Purpose: Convenience wrapper that accepts raw addresses instead of DIDs. Internally builds `did:pkh` DIDs from the addresses and delegates to `calculateTransferAmount`.
- Throws: `INVALID_INPUT`, `UNSUPPORTED_CHAIN`

#### `constructSeed(subjectDidHash, counterpartyDidHash, purpose)`

```ts
function constructSeed(
  subjectDidHash: Hex,
  counterpartyDidHash: Hex,
  purpose: ProofPurpose
): Uint8Array;
```

- Purpose: Build the canonical JCS (RFC 8785) seed object per §5.3.6.3, canonicalize it, and return the UTF-8 bytes. This seed is the input to `hashSeed`.

#### `hashSeed(seedBytes, chainId)`

```ts
function hashSeed(
  seedBytes: Uint8Array,
  chainId: number
): Hex;
```

- Purpose: Hash the seed bytes using the chain-appropriate algorithm (keccak256 for EVM chains, SHA-256 for others).
- Throws: `UNSUPPORTED_CHAIN`

#### `getChainConstants(chainId, purpose)`

```ts
function getChainConstants(
  chainId: number,
  purpose: ProofPurpose
): ChainConstants;
```

- Purpose: Return the BASE and RANGE constants for a given chain and proof purpose. These are spec-defined values (Appendix A) used in the transfer amount calculation.
- Returns: `ChainConstants` with `base` (minimum amount), `range` (amount range), `decimals` (native token decimals), and `nativeSymbol` (e.g., `"ETH"`, `"MATIC"`).
- Throws: `UNSUPPORTED_CHAIN`

#### `formatTransferAmount(amount, chainId)`

```ts
function formatTransferAmount(
  amount: bigint | number,
  chainId: number
): string;
```

- Purpose: Format a transfer amount for human-readable display (e.g., `"0.000000000000001234 ETH"`).
- Throws: `UNSUPPORTED_CHAIN`

#### `getSupportedChainIds()`

```ts
function getSupportedChainIds(): number[];
```

- Purpose: List all chain IDs that support tx-encoded-value proofs.

#### `isChainSupported(chainId)`

```ts
function isChainSupported(chainId: number): boolean;
```

- Purpose: Check if a specific chain ID supports tx-encoded-value proofs.

### evidence-pointer Helpers

#### `verifyDnsTxtControllerDid(domain, expectedControllerDid)`

```ts
function verifyDnsTxtControllerDid(
  domain: string,
  expectedControllerDid: Did
): Promise<{ valid: boolean; record?: string; reason?: string }>;
```

- Purpose: Verify that the `_omatrust.<domain>` DNS TXT record contains the expected controller DID.
- Node.js only — uses the `dns` module for resolution. Not available in browsers.
- Throws: `NETWORK_ERROR`

#### `parseDnsTxtRecord(record)`

```ts
function parseDnsTxtRecord(
  record: string
): { version?: string; controller?: Did; [key: string]: string | undefined };
```

- Purpose: Parse a DNS TXT record or evidence string in `v=1;controller=did:pkh:...` format into key-value pairs. This format is used by both DNS TXT records and social profile evidence strings (§5.3.5.2).
- Throws: `INVALID_INPUT`

#### `buildDnsTxtRecord(controllerDid)`

```ts
function buildDnsTxtRecord(controllerDid: Did): string;
```

- Purpose: Build the expected `v=1;controller=<DID>` evidence string for a given controller DID.

#### `fetchDidDocument(domain)`

```ts
function fetchDidDocument(
  domain: string
): Promise<Record<string, unknown>>;
```

- Purpose: Fetch `https://<domain>/.well-known/did.json` and return the parsed DID document.
- Throws: `NETWORK_ERROR`

#### `verifyDidDocumentControllerDid(didDocument, expectedControllerDid)`

```ts
function verifyDidDocumentControllerDid(
  didDocument: Record<string, unknown>,
  expectedControllerDid: Did
): { valid: boolean; reason?: string };
```

- Purpose: Verify that a DID document's controller or verificationMethod addresses match the expected controller DID.

#### `extractAddressesFromDidDocument(didDocument)`

```ts
function extractAddressesFromDidDocument(
  didDocument: Record<string, unknown>
): string[];
```

- Purpose: Extract all Ethereum addresses from a DID document's `verificationMethod` array.

### EIP-712 Helpers

#### `verifyEip712Signature(typedData, signature)`

```ts
function verifyEip712Signature(
  typedData: { domain: Record<string, unknown>; types: Record<string, unknown>; message: Record<string, unknown> },
  signature: Hex | string
): { valid: boolean; signer?: string };
```

- Purpose: Recover the signer address from an EIP-712 typed data signature and verify it.
- Throws: `INVALID_INPUT`

#### `buildEip712Domain(name, version, chainId, verifyingContract)`

```ts
function buildEip712Domain(
  name: string,
  version: string,
  chainId: number,
  verifyingContract: Hex
): { name: string; version: string; chainId: number; verifyingContract: Hex };
```

- Purpose: Build a standard EIP-712 domain separator object.

#### `getOmaTrustProofEip712Types()`

```ts
function getOmaTrustProofEip712Types(): {
  primaryType: string;
  types: Record<string, Array<{ name: string; type: string }>>;
};
```

- Purpose: Return the canonical OMATrust EIP-712 types and primaryType for `pop-eip712` proofs as defined in the Proof Specification §5.3.3. Useful for building signing requests or verifying proofs without hardcoding the schema.

### Explorer Helpers

#### `getExplorerTxUrl(chainId, txHash)`

```ts
function getExplorerTxUrl(chainId: number, txHash: Hex): string;
```

- Purpose: Build a block explorer URL for a transaction (e.g., Etherscan, Basescan).
- Throws: `UNSUPPORTED_CHAIN`

#### `getExplorerAddressUrl(chainId, address)`

```ts
function getExplorerAddressUrl(chainId: number, address: string): string;
```

- Purpose: Build a block explorer URL for an address.
- Throws: `UNSUPPORTED_CHAIN`

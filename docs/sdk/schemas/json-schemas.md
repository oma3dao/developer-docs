---
title: JSON Schemas (Canonical)
sidebar_position: 1
---

# JSON Schemas (Canonical)

All OMATrust attestation types are defined as [JSON Schema](https://json-schema.org/) (Draft 2020-12) files. These are the canonical, source-of-truth definitions from which EAS schema strings, form UIs, and SDK types are all derived.

The schema files live in the `schemas-json/` directory of the [`rep-attestation-tools-evm-solidity`](https://github.com/oma3dao/rep-attestation-tools-evm-solidity/tree/main/schemas-json) repository.

## Available Schemas

| Schema | File | Description |
| --- | --- | --- |
| User Review | `user-review.schema.json` | Structured 1–5 star reviews of tokenized applications or digital services |
| User Review Response | `user-review-response.schema.json` | Responses to user reviews (from the reviewed subject) |
| Endorsement | `endorsement.schema.json` | Lightweight attestation indicating support, trust, or approval for a subject |
| Certification | `certification.schema.json` | Formal certification of a subject by an authorized assessor |
| Security Assessment | `security-assessment.schema.json` | Security audit or assessment results for a subject |
| Key Binding | `key-binding.schema.json` | Binds a cryptographic key to a DID subject |
| Linked Identifier | `linked-identifier.schema.json` | Links an external identifier (social handle, domain, etc.) to a DID subject |
| Controller Witness | `controller-witness.schema.json` | Immutable record that a trusted observer verified a controller assertion |
| Common Definitions | `common.schema.json` | Shared `$defs` referenced by other schemas (Version, Proof, PayloadVersion, etc.) |

## Browsing the Schemas

The full JSON Schema files with all properties, validation rules, and OMA3 extensions are available on GitHub:

👉 [**github.com/oma3dao/rep-attestation-tools-evm-solidity/tree/main/schemas-json**](https://github.com/oma3dao/rep-attestation-tools-evm-solidity/tree/main/schemas-json)

Each file is self-contained (aside from `$ref` imports from `common.schema.json`) and includes:

- Standard JSON Schema validation (`type`, `pattern`, `maxLength`, `enum`, `required`, etc.)
- OMA3 custom extensions (`x-oma3-skip-reason`, `x-oma3-subtype`, `x-oma3-default`, `x-oma3-did-methods`, `x-oma3-enum`, `x-oma3-nested`, `x-oma3-witness`)

## OMA3 Schema Extensions

The schemas use custom `x-oma3-*` properties to control UI rendering, auto-generation, and EAS field mapping. Key extensions:

| Extension | Purpose |
| --- | --- |
| `x-oma3-skip-reason` | Excludes fields from form generation (`"metadata"`, `"eas"`, `"computed"`, `"unused"`) |
| `x-oma3-subtype` | Semantic type hint (`"timestamp"`, `"semver"`) for UI rendering |
| `x-oma3-default` | Auto-generation behavior (`"current-timestamp"`, `"current-datetime"`, `"current-date"`) |
| `x-oma3-did-methods` | Recommended DID methods for a field (`"web"`, `"pkh"`, `"key"`, `"handle"`) |
| `x-oma3-enum` | Suggested values without strict validation (for extensible registries) |
| `x-oma3-nested` | Controls whether an object field renders as a grouped container in UIs |
| `x-oma3-witness` | Top-level flag that triggers a Controller Witness API call after attestation |

For full documentation on each extension with examples, see the [`schemas-json/README.md`](https://github.com/oma3dao/rep-attestation-tools-evm-solidity/blob/main/schemas-json/README.md) in the repository.

## JSON Schema → EAS Schema Pipeline

JSON Schema files are the input to the `generate-eas-object` Hardhat task, which produces the flat EAS ABI schema strings used on-chain. The mapping rules are:

- `string` → `string`
- `integer` / `number` → `uint256`
- `boolean` → `bool`
- `object` → `string` (JSON-stringified)
- `array` of T → `T[]`
- Fields with `x-oma3-skip-reason: "metadata"` or `"eas"` are excluded from the EAS schema
- Fields with `x-oma3-skip-reason: "unused"` are included (reserved per spec)
- Hex hash patterns (`0x[a-fA-F0-9]{64}`) map to `bytes32`

See [EAS Schema Definitions](./eas-schema-definitions.md) for the generated on-chain schemas.

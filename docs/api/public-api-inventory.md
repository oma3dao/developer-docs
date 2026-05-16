---
id: public-api-inventory
title: Public API Inventory
sidebar_position: 0
---

# Public API Inventory

Canonical public APIs are exposed through:

```txt
https://api.omatrust.org/v1
```

Product frontends such as `registry.omatrust.org` and `reputation.omatrust.org` may still expose application-local routes, but those should be treated as implementation details unless they are also documented here.

## Gateway APIs

| Public endpoint | Method | Upstream service | Current use |
| --- | --- | --- | --- |
| `/v1/trust-anchors` | GET | OMATrust backend | Returns OMA3 trust anchors including chain, schema, widget origin, and registry anchors. |
| `/v1/controller-endpoint-confirm` | GET | OMATrust backend | Checks endpoint-published controller keys from DNS, `did.json`. |
| `/v1/controller-confirm` | GET | OMATrust backend | Resolves current controller evidence, account-wallet evidence, and approved issuer status. |
| `/v1/identity-resolve` | POST | OMATrust backend | Resolves identifiers into canonical forms and display labels. |
| `/v1/controller-witness` | POST | App Registry / controller witness service | Creates Controller Witness attestations from published controller evidence. |
| `/v1/verify-and-attest` | POST | App Registry verification service | Verifies app registry metadata and submits registry attestations. |
| `/v1/delegated-attest` | POST | Reputation frontend relay | Submits gas-sponsored delegated EAS attestations. |
| `/v1/nonce` | GET | Reputation frontend relay | Returns EAS delegated attestation nonce data for an attester. |

## Removed Compatibility Aliases

The following aliases were previously available but have been removed. All callers now use the canonical endpoints directly.

| Former alias | Canonical endpoint |
| --- | --- |
| `/v1/trust-policy` | `/v1/trust-anchors` |
| `/v1/service-controller/summary` | `/v1/controller-confirm` |
| `/v1/identity/resolve` | `/v1/identity-resolve` |

## Application-Local APIs

These routes exist in product repositories and are useful for local development or application internals. Long-term public access should move behind `api.omatrust.org/v1`.

| Repository | Route | Method | Notes |
| --- | --- | --- | --- |
| `rep-attestation-frontend` | `/api/eas/nonce` | GET | Local relay nonce route. Public equivalent: `/v1/nonce`. |
| `rep-attestation-frontend` | `/api/eas/delegated-attest` | POST | Local delegated attestation route. Public equivalent: `/v1/delegated-attest`. |
| `rep-attestation-frontend` | `/api/controller-witness-proxy` | POST | Frontend proxy to controller witness service. Public equivalent: `/v1/controller-witness`. |
| `omatrust-backend` | `/api/public/trust-anchors` | GET | Backend origin for `/v1/trust-anchors`. |
| `omatrust-backend` | `/api/public/controller-endpoint-confirm` | GET | Backend origin for `/v1/controller-endpoint-confirm`. |
| `omatrust-backend` | `/api/public/controller-confirm` | GET | Backend origin for `/v1/controller-confirm`. |
| `omatrust-backend` | `/api/public/identity-resolve` | POST | Backend origin for `/v1/identity-resolve`. |
| `omatrust-backend` | `/api/verify/subject-ownership` | POST | Backend subject ownership verification used by account flows. |
| `omatrust-widgets` | `/api/proof/check` | POST | Widget proof-check route for interaction evidence. |

## Strategy Notes

- The API gateway remains the public facade; business logic and trust anchor ownership live in backend services.
- Public `v1` endpoints use flat names rather than category/path nesting.
- Current mutable evidence and immutable attestations are separate concepts. Current evidence belongs in confirmation and resolution APIs; immutable evidence belongs in EAS attestations such as Controller Witness and Key Binding.

---
id: trust-anchors
title: Trust Anchors API
sidebar_position: 0
---

# Trust Anchors API

The Trust Anchors API returns the OMA3-maintained trust anchors used by clients, widgets, and services to make local validation decisions. It provides EAS contract addresses, schema name-to-UID mappings, approved issuer lists, and widget origin allowlists.

## Endpoint

```txt
GET https://api.omatrust.org/v1/trust-anchors
```

## Response

```json
{
  "version": 1,
  "updatedAt": "2026-05-02T00:00:00Z",
  "widgetOrigins": [],
  "chains": {
    "eip155:66238": {
      "name": "OMAChain Testnet",
      "easContract": "0x8835AF90f1537777F52E482C8630cE4e947eCa32",
      "schemas": {
        "user-review": "0x7ab3...",
        "linked-identifier": "0x26e2...",
        "key-binding": "0x807b...",
        "controller-witness": "0xc814..."
      }
    }
  },
  "registries": [
    {
      "type": "approved-issuers",
      "issuers": [
        {
          "address": "0x6f05D46...",
          "label": "OMA3 Testnet Attestation",
          "schemas": ["security-assessment", "certification"]
        }
      ]
    }
  ]
}
```

## Fields

| Field | Type | Description |
| --- | --- | --- |
| `version` | number | Trust anchors response version. Increment on breaking response-shape changes. |
| `updatedAt` | string | ISO 8601 timestamp of the last trust anchor update. |
| `widgetOrigins` | string[] | Additional trusted widget origins beyond `*.omatrust.org`. |
| `chains` | object | CAIP-2 chain identifier (e.g., `"eip155:66238"`) to chain-specific trust anchors. |
| `chains.*.name` | string | Human-readable chain name. |
| `chains.*.easContract` | string | Trusted EAS contract address on this chain. |
| `chains.*.schemas` | object | Schema name → schema UID mapping. Keys are human-readable schema names (e.g., `"user-review"`, `"certification"`). Values are the deployed schema UIDs on this chain. |
| `registries` | object[] | OMA3-maintained trust registries. |
| `registries[].type` | string | Registry type. Currently only `"approved-issuers"`. |
| `registries[].issuers` | object[] | List of approved issuers (when type is `"approved-issuers"`). |
| `registries[].issuers[].address` | string | Wallet address or DID of the approved issuer. |
| `registries[].issuers[].label` | string | Human-readable label for the issuer. |
| `registries[].issuers[].schemas` | string[] | Schema names this issuer is approved for (e.g., `["certification"]`). |

## Verifier Workflow

A verifier client can use trust anchors to validate attestations:

1. Fetch trust anchors: `GET /v1/trust-anchors`
2. Look up the schema UID by name: `chains["eip155:66238"].schemas["certification"]`
3. Query EAS for attestations with that schema UID
4. Filter results: check if the attester address appears in `registries[0].issuers` with the matching schema name in their `schemas` array

## Method and CORS

`GET` only. `OPTIONS` returns 204 with CORS headers. Other methods return 405.

All responses include `Access-Control-Allow-Origin: *`.

## SDK Helpers

The `@oma3/omatrust` SDK provides helper functions for working with trust anchors:

```ts
import { fetchTrustAnchors, getChainAnchors, getSchemaAnchor, extractAllowlists } from "@oma3/omatrust/widgets";

// Fetch and cache trust anchors (5-minute TTL)
const anchors = await fetchTrustAnchors();

// Look up chain-specific anchors by CAIP-2 identifier (throws UNSUPPORTED_CHAIN)
const chain = getChainAnchors(anchors, "eip155:66238");

// Look up a schema UID by name (throws INVALID_INPUT if not found on chain)
const schemaUid = getSchemaAnchor(anchors, "eip155:66238", "controller-witness");

// Extract all allowed contracts and schema UIDs across chains
const { allowedContracts, allowedSchemas } = extractAllowlists(anchors);
```

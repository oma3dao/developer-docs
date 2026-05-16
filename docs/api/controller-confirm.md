---
id: controller-confirm
title: Controller Confirm API
sidebar_position: 1
---

# Controller Confirm API

The Controller Confirm API resolves the current controller evidence for a service identity without requiring browser clients to fetch DNS records, `did.json`, `agent.json`, issuer registries, or attestation-backed controller data directly.

This API is intended for dashboards, wallets, agents, and indexers that need a current view of the keys a service publishes or uses.

## Endpoint

```txt
GET https://api.omatrust.org/v1/controller-confirm
```

## Query Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `subjectDid` | string | Yes | Service subject DID. Domain metadata discovery is currently supported for `did:web` subjects. Bare domains are normalized by the backend. |
| `walletDid` | string | No | Connected wallet/controller DID, usually `did:pkh:eip155:<chainId>:<address>`. Included as an account-wallet key candidate and used for approved issuer lookup. Use `validatePrivateKeyDid()` from the SDK to pre-validate this value. |

## What It Checks

`/v1/controller-confirm` is the full controller confirmation endpoint. It can include endpoint-published evidence, account wallet evidence, issuer registry status, and attestation-backed controller evidence as those sources are added to the backend.

For `did:web` subjects, the backend checks:

- DNS TXT records at `_controllers.<domain>`.
- DNS TXT records at `_omatrust.<domain>` for compatibility with existing controller-witness docs.
- `https://<domain>/.well-known/did.json`.
- The configured approved issuer registry, if available.

The API deduplicates controller keys using OMATrust SDK DID normalization. For `did:pkh`, this follows the CAIP-10 account identifier shape wrapped as `did:pkh:<chain_id>:<account_address>`.

## Response

```json
{
  "subject": {
    "input": "did:web:example.com",
    "canonical": "did:web:example.com",
    "label": "example.com",
    "type": "did-web",
    "source": "did-web"
  },
  "domain": "example.com",
  "controllerKeys": [
    {
      "id": "did:pkh:eip155:66238:0xabc...",
      "canonicalId": "did:pkh:eip155:66238:0xabc...",
      "label": "0xabc...1234",
      "sources": ["dns-txt", "account-wallet"],
      "basic": true
    }
  ],
  "evidence": [
    {
      "kind": "dns-txt",
      "status": "found",
      "location": "_controllers.example.com",
      "keys": ["did:pkh:eip155:66238:0xabc..."]
    }
  ],
  "approvedIssuer": {
    "status": "not-approved",
    "checkedIdentifiers": ["did:pkh:eip155:66238:0xabc..."],
    "registryUrl": null
  },
  "warnings": []
}
```

## Status Values

Evidence source `status` values:

| Status | Meaning |
| --- | --- |
| `found` | Source was reachable and included one or more controller keys. |
| `not-found` | Source was reachable or absent, but no keys were found. |
| `unavailable` | Source could not be checked due to timeout, network, or non-404 HTTP failure. |
| `unsupported` | The subject type is not supported for that evidence mechanism. |

Approved issuer `status` values:

| Status | Meaning |
| --- | --- |
| `approved` | The supplied wallet/controller appears in the configured approved issuer registry. |
| `not-approved` | The registry was checked and did not include the supplied wallet/controller. |
| `unavailable` | The registry is configured but could not be read. |
| `not-configured` | No registry is configured, or no wallet/controller was supplied. |

## Notes

This endpoint returns current mutable evidence. For endpoint-only DNS and JSON confirmation, use `/v1/controller-endpoint-confirm`. For immutable evidence at a point in time, use Controller Witness and Key Binding attestations.

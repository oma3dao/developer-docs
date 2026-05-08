---
id: controller-endpoint-confirm
title: Controller Endpoint Confirm API
sidebar_position: 2
---

# Controller Endpoint Confirm API

The Controller Endpoint Confirm API checks only the controller keys published by a service identity through its own endpoints. It does not inspect account wallets, issuer registry status, or blockchain attestations.

Use this endpoint when you need a current, endpoint-only confirmation of a `did:web` service identity.

## Endpoint

```txt
GET https://api.omatrust.org/v1/controller-endpoint-confirm
```

## Query Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `subjectDid` | string | Yes | Service subject DID. Endpoint discovery is currently supported for `did:web` subjects. Bare domains are normalized by the backend. |

## What It Checks

For `did:web` subjects, the backend checks:

- DNS TXT records at `_controllers.<domain>`.
- DNS TXT records at `_omatrust.<domain>` for compatibility with existing controller-witness docs.
- `https://<domain>/.well-known/did.json`.

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
      "sources": ["dns-txt"],
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
  "warnings": []
}
```

## Status Values

| Status | Meaning |
| --- | --- |
| `found` | Source was reachable and included one or more controller keys. |
| `not-found` | Source was reachable or absent, but no keys were found. |
| `unavailable` | Source could not be checked due to timeout, network, or non-404 HTTP failure. |
| `unsupported` | The subject type is not supported for that evidence mechanism. |

## Related API

Use `/v1/controller-confirm` when you want the fuller confirmation result that can include endpoint evidence, account wallet evidence, issuer registry status, and attestation-backed evidence.

---
id: identity-resolve
title: Identity Resolve API
sidebar_position: 2
---

# Identity Resolve API

The Identity Resolve API converts DIDs, CAIP-10 account identifiers, and EVM addresses into canonical identifiers and short human-readable labels for display.

It is a display helper, not an authorization decision point. Authorization and ownership checks should use the relevant attestation, subject ownership, or controller confirmation APIs.

## Endpoint

```txt
POST https://api.omatrust.org/v1/identity-resolve
```

`POST /v1/identity/resolve` remains available as a compatibility alias. New integrations should use the flat `/v1/identity-resolve` path.

## Request

```json
{
  "identifiers": [
    "did:web:example.com",
    "did:pkh:eip155:66238:0xabc0000000000000000000000000000000001234",
    "0xabc0000000000000000000000000000000001234"
  ]
}
```

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `identifiers` | string[] | Yes | Up to 100 identifiers. Supported inputs include `did:web`, `did:pkh`, `did:jwk`, `did:key`, `did:handle`, `did:ethr`, CAIP-10 account IDs, and EVM addresses. |

## Response

```json
{
  "identities": [
    {
      "input": "did:web:example.com",
      "canonical": "did:web:example.com",
      "label": "example.com",
      "type": "did-web",
      "source": "did-web"
    },
    {
      "input": "0xabc0000000000000000000000000000000001234",
      "canonical": "0xabc0000000000000000000000000000000001234",
      "label": "0xabc0...1234",
      "type": "address",
      "source": "address"
    }
  ]
}
```

## Future Resolution Sources

The first version uses deterministic labels from the identifier itself. Future versions can add:

- OMATrust account and subject display names.
- ENS or other public naming systems.
- Registry profile names.
- Trust-ranked aliases with source/confidence metadata.

---
title: Publish an Attestation
---

# Publish an Attestation via the Portal

The OMATrust Portal provides a form-based interface for publishing attestations without writing code.

:::info
This page covers the portal UI workflow. For programmatic attestation publishing, see the [SDK Quickstart](/start-here/quickstart-publish).
:::

## Prerequisites

- Signed in to [app.omatrust.org](https://app.omatrust.org) via social login or self-custody wallet — see [Connect or Sign In](/portal/connect-wallet)
- The DID of the service you're attesting (e.g., `did:web:example.com`)

No gas fees or OMA tokens are required. The portal uses a delegated attestation flow.

## Attestation Types

You can publish the following attestation types through the portal:

| Type | Who publishes | Purpose |
|---|---|---|
| Security Audit | Auditor | Attest that a service passed a security review |
| Compliance Certification | Certifier | Attest compliance with a standard (SOC2, ISO, etc.) |
| Endorsement | Any entity | Vouch for a service's quality or reliability |
| User Review | End user | Share your experience with a service |
| Review Response | Service operator | Respond to a user review on-chain |

## Publishing Flow

1. Select the attestation type
2. Enter the target service DID
3. Fill in the attestation-specific fields (score, comments, evidence URL, etc.)
4. Review the attestation preview
5. Click **Submit** — your wallet will prompt you to sign the attestation data
6. The portal submits the transaction on-chain via the delegated flow
7. Wait for confirmation

Once confirmed, the attestation is permanently recorded on OMAChain and verifiable by anyone.

## Delegated Flow

The portal uses delegated attestations — you sign the attestation payload with your wallet (or embedded wallet), and the OMATrust backend submits the actual on-chain transaction. This means:

- No OMA tokens needed
- No network switching in your wallet
- Your signature is still cryptographically tied to your account

## Next Steps

- Learn about [attestation types and schemas](/reputation/attestation-types) in detail
- Want to publish programmatically? See the [SDK Quickstart](/start-here/quickstart-publish)

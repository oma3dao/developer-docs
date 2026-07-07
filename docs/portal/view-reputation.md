---
title: View Reputation
---

# View Reputation via the Portal

Look up any service's on-chain attestations and trust score using the OMATrust Portal.

## Searching for a Service

1. Navigate to the Reputation Portal at [https://reputation.oma3.org](https://reputation.oma3.org)
2. Enter a service DID (e.g., `did:web:example.com`) in the search field
3. The portal displays all attestations associated with that service

## What You'll See

For each service, the portal shows:

- **Trust score** — An aggregated score based on all attestations
- **Attestation list** — Each attestation with its type, issuer, timestamp, and expiration
- **Issuer details** — Who published each attestation and their own trust level
- **Verification status** — Whether attestations are active, expired, or revoked

## Filtering and Sorting

You can filter attestations by:
- Type (audit, certification, endorsement, review)
- Issuer
- Date range
- Status (active vs. expired)

## No Wallet Required

Viewing reputation data is a read-only operation. You don't need a connected wallet or OMA tokens to look up a service's attestations — just a browser.

## Verifying Attestation Authenticity

Every attestation displayed in the portal is backed by an on-chain record. You can independently verify any attestation by:

1. Clicking the transaction hash link to view it on the [OMAChain Explorer](https://explorer.omachain.org/)
2. Using the [SDK verification flow](/start-here/quickstart-verify) for programmatic checks

## Next Steps

- [Publish your own attestation](/portal/publish-attestation)
- Understand the [reputation model](/reputation/reputation-model) and how trust scores are calculated
- Integrate trust checks into your app with the [SDK](/sdk/getting-started)

---
id: artifact-trust
title: Artifact Trust API
sidebar_position: 1
---

# Artifact Trust API

The Artifact Trust API returns the complete set of verified OMATrust evidence
associated with a `did:artifact`. It is intended for plugin loaders, package
managers, security tools, and other clients that need to present an artifact's
provenance and assessment evidence without implementing EAS and
schema-specific verification themselves.

Every returned evidence record is verified. Invalid, revoked, expired,
malformed, incorrectly bound, or otherwise unverified candidates are excluded.

## Endpoint

Production:

```txt
GET https://api.omatrust.org/v1/artifact-trust
```

Staging / testnet gateway (when deployed):

```txt
GET https://test.api.omatrust.org/v1/artifact-trust
```

This endpoint is public and requires no session or API key. It is exposed
through the OMATrust API gateway and proxied to the backend
`/api/public/artifact-trust` route for the gateway's active chain.


MPAS uses the complete production gateway URL above by default. Operators do
not configure a backend base URL or API key in v1.

## Query Parameters

| Parameter     | Type   | Required | Description                                           |
| ------------- | ------ | -------- | ----------------------------------------------------- |
| `artifactDid` | string | Yes      | Canonical `did:artifact` whose evidence is requested. |

The API does not accept caller-selected RPC URLs, schema lists, block ranges,
verification bypasses, or invalid-evidence flags.

## Example Request

```sh
curl --get "https://api.omatrust.org/v1/artifact-trust" \
  --data-urlencode "artifactDid=did:artifact:bafk..."
```

## Successful Response

```json
{
  "artifactDid": "did:artifact:bafk...",
  "chain": {
    "chainId": 6623,
    "caip2": "eip155:6623",
    "easContract": "0x..."
  },
  "trustAnchorsVersion": 1,
  "responsibilityClaims": [
    {
      "attestation": {
        "uid": "0x...",
        "schema": "0x...",
        "schemaName": "responsibility-claim",
        "attester": "0x...",
        "recipient": "0x...",
        "time": "1784822400",
        "expirationTime": "0",
        "revocationTime": "0",
        "data": {
          "subject": "did:artifact:bafk...",
          "responsibleParty": "did:web:publisher.example",
          "responsibilityType": ["publisher", "maintainer"],
          "subjectLabel": "Example plugin",
          "issuedAt": "1784822400",
          "effectiveAt": "1784822400",
          "expiresAt": "0"
        }
      },
      "verification": {
        "valid": true,
        "basis": [
          "proof",
          "controller-authorization",
          "authorization-window"
        ]
      }
    }
  ],
  "securityAssessments": [
    {
      "attestation": {
        "uid": "0x...",
        "schema": "0x...",
        "schemaName": "security-assessment",
        "attester": "0x...",
        "attesterLabel": "OMA3 Security Lab",
        "recipient": "0x...",
        "time": "1784822400",
        "expirationTime": "0",
        "revocationTime": "0",
        "data": {
          "subject": "did:artifact:bafk...",
          "organization": "OMA3 Security Lab",
          "version": "1.0.0",
          "versionHW": "",
          "payload": "{}",
          "payloadVersion": "1",
          "payloadSpecURI": "https://example.org/security-assessment",
          "payloadSpecDigest": "sha256:...",
          "issuedAt": "1784822400",
          "effectiveAt": "1784822400",
          "expiresAt": "0"
        }
      },
      "verification": {
        "valid": true,
        "basis": ["approved-issuer"]
      }
    }
  ],
  "certifications": [],
  "otherAttestations": [
    {
      "attestation": {
        "uid": "0x...",
        "schema": "0x...",
        "schemaName": "linked-identifier",
        "attester": "0x...",
        "recipient": "0x...",
        "time": "1784822400",
        "expirationTime": "0",
        "revocationTime": "0",
        "data": {
          "subject": "did:artifact:bafk...",
          "linkedId": "did:web:publisher.example",
          "method": "controller",
          "proofs": ["..."],
          "issuedAt": "1784822400",
          "effectiveAt": "1784822400",
          "expiresAt": "0"
        }
      },
      "verification": {
        "valid": true,
        "basis": [
          "proof",
          "controller-authorization",
          "authorization-window"
        ]
      }
    }
  ],
  "summary": {
    "totalQueried": 3,
    "totalVerified": 3,
    "totalExcluded": 0,
    "complete": true
  }
}
```

## Response Fields

| Field                          | Type     | Description                                                                             |
| ------------------------------ | -------- | --------------------------------------------------------------------------------------- |
| `artifactDid`                  | string   | Canonical artifact DID used for the lookup.                                             |
| `chain.chainId`                | number   | Numeric chain ID selected by the backend environment.                                   |
| `chain.caip2`                  | string   | CAIP-2 identifier for the queried chain.                                                |
| `chain.easContract`            | string   | EAS contract from which attestations were read.                                         |
| `trustAnchorsVersion`          | number   | Trust-anchor version used during verification.                                          |
| `responsibilityClaims`         | object[] | Verified claims identifying an entity that accepts responsibility for the artifact.     |
| `securityAssessments`          | object[] | Verified cybersecurity assessments from approved issuers.                               |
| `certifications`               | object[] | Verified certifications. These are informational for the MPAS plugin trust policy.      |
| `otherAttestations`            | object[] | Extensible verified evidence group. In v1, this can include linked identifiers.         |
| `summary.totalQueried`         | number   | Candidate records retrieved before verification filtering.                              |
| `summary.totalVerified`        | number   | Records returned across all four evidence groups.                                       |
| `summary.totalExcluded`        | number   | Retrieved candidates excluded by verification.                                          |
| `summary.complete`             | boolean  | Always `true` on success; the response is a complete lookup rather than a partial page. |
| `*.attestation.uid`            | string   | EAS attestation UID.                                                                    |
| `*.attestation.schema`         | string   | EAS schema UID.                                                                         |
| `*.attestation.schemaName`     | string   | Human-readable trust-anchor schema name.                                                |
| `*.attestation.attester`       | string   | On-chain attester address.                                                              |
| `*.attestation.attesterLabel`  | string   | Optional label for a recognized approved issuer.                                        |
| `*.attestation.time`           | string   | EAS issuance time as a base-10 Unix timestamp string.                                   |
| `*.attestation.expirationTime` | string   | EAS expiration time as a base-10 string; `"0"` means no EAS-level expiration.           |
| `*.attestation.revocationTime` | string   | EAS revocation time. Returned records always have `"0"`.                                |
| `*.attestation.data`           | object   | Decoded, schema-validated public attestation payload.                                   |
| `*.verification.valid`         | boolean  | Always `true` for returned records.                                                     |
| `*.verification.basis`         | string[] | Material schema-specific mechanisms used to qualify the record.                         |

## Evidence and Verification Model

Different schemas use different verification mechanisms. Consumers should not
treat all records as interchangeable.

| Schema                 | Importance    | Verification mechanism                                                                                                                                                           | Consumer guidance                                                                                       |
| ---------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `responsibility-claim` | Primary       | The claim's `subject` must equal the requested artifact DID. Its separate `responsibleParty` DID identifies the claimant, and the attesting controller relationship is verified. | Display the responsible party prominently and require the user to decide whether that party is trusted. |
| `security-assessment`  | Primary       | The attester must be an active approved issuer for the cybersecurity-assessment schema.                                                                                          | Strong assessment signal: display the issuer and assessment data prominently.                           |
| `linked-identifier`    | Secondary     | Schema-specific authorization proofs and applicable controller-relationship and authorization-window checks must validate.                                                       | Display every verified link and let the user judge its relevance; a link is not automatically trusted.  |
| `certification`        | Informational | The attester must be an active approved issuer for the certification schema.                                                                                                     | Display as additional evidence; it does not replace either primary signal in the MPAS policy.           |
| `user-review`          | Not returned  | The user-review schema cannot establish a provable binding to a `did:artifact`.                                                                                                  | Do not use user reviews as artifact trust evidence.                                                     |

The artifact DID identifies the artifact being discussed. It does not and
cannot authorize an attester. In a responsibility claim, `responsibleParty`
identifies the separate entity claiming responsibility for the artifact.
Verification establishes the authenticity and binding of that claim; it does
not establish that the responsible party is legitimate or trustworthy.
Applications should state this distinction beside each responsibility claim,
not merely describe the record as verified.

For the MPAS plugin policy, either a returned responsibility claim or a
returned cybersecurity assessment is sufficient to suppress the warning; both
are not required. MPAS always shows the evidence and asks the operator to
decide whether to continue. It adds a warning when both primary groups are
empty or when the API request cannot be completed. Linked identifiers and
informational certifications do not suppress that warning.

Possible `verification.basis` values are:

| Value                      | Meaning                                                                           |
| -------------------------- | --------------------------------------------------------------------------------- |
| `approved-issuer`          | The attester is an active issuer approved for that schema.                        |
| `proof`                    | The schema-specific proof was required and verified.                              |
| `controller-authorization` | The relevant attesting controller relationship was verified.                      |
| `authorization-window`     | The attestation was issued during the applicable controller authorization window. |

Controller Witness attestations may support controller verification for
responsibility claims and linked identifiers, but they are not returned as
direct artifact evidence.

## Chain Selection

The backend selects its chain and public RPC endpoint from the deployment's
`OMATRUST_ACTIVE_CHAIN` environment. There is no `chain` request parameter in
v1. The response's `chain` object always identifies the chain and EAS contract
actually queried.

## Empty Results

No qualifying evidence is a successful result. The endpoint returns `200`,
all four evidence arrays empty, and:

```json
{
  "summary": {
    "totalQueried": 0,
    "totalVerified": 0,
    "totalExcluded": 0,
    "complete": true
  }
}
```

A backend dependency failure is not represented as an empty successful result.

## Errors

| HTTP status | Code                | Meaning                                                                                      |
| ----------- | ------------------- | -------------------------------------------------------------------------------------------- |
| 400         | `INVALID_DID`       | `artifactDid` is missing, malformed, or is not a `did:artifact`.                             |
| 400         | `UNSUPPORTED_CHAIN` | The backend's active chain lacks the required EAS contract, trust anchors, or schema policy. |
| 502         | `NETWORK_ERROR`     | Public RPC, EAS, schema registry, or required verification lookup failed.                    |
| 500         | `INTERNAL_ERROR`    | An unexpected server error occurred; implementation details are not exposed.                 |

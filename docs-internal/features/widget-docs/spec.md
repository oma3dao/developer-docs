# Widget Documentation — Spec

Status: Implemented

## Goal

Provide clear developer documentation for integrating the OMATrust review widget in both basic and integrated modes.

## Protocol reference

The signing protocol documented in these pages is defined in:

→ [omatrust-sdk/docs/features/widget-signing-bridge/spec.md](https://github.com/oma3dao/omatrust-sdk/blob/main/docs/features/widget-signing-bridge/spec.md)

## Pages

### Overview (`docs/widgets/overview.md`)

- What the widget is (embeddable iframe, auto-proofs, same-wallet signing)
- How it works (5-step flow)
- Signing modes guide (basic vs integrated with decision criteria)
- Contract-to-domain binding instructions (Linked Identifier)
- Identity model (did:web subject)

### Basic Mode (`docs/widgets/basic-mode.md`)

- Quick start (generate → paste → optional wallet injection)
- Query parameters reference table
- Contract address guidance (must be user-facing contract)
- Proof check explanation
- Supported wallets list

### Integrated Mode (`docs/widgets/integrated-mode.md`)

- Quick start (generate → paste → install SDK → add bridge)
- Code examples for Thirdweb, wagmi/viem, ethers
- `createSigningBridge` API reference
- Mode detection explanation
- Security section (three-layer validation, bridge checks, cross-origin)
- postMessage protocol reference

## Acceptance Criteria

- [ ] Overview explains both signing modes with clear decision criteria
- [ ] Overview includes binding instructions with link to attestation types
- [ ] Basic mode has a complete quick start that works with copy-paste
- [ ] Basic mode documents all query parameters
- [ ] Integrated mode has working code examples for major wallet libraries
- [ ] Integrated mode documents the `createSigningBridge` API
- [ ] Integrated mode security section matches the SDK spec
- [ ] Handshake timeout documented as 3 seconds with retries
- [ ] All pages build without errors in Docusaurus
- [ ] Sidebar includes Widgets section

# Integration Notes (v0.1.0)

## Trellis

Current behavior:
- reports discovery/install hook intent
- declares required environment contract
- no runtime coupling or fake daemon process

Future:
- explicit driver contract and capability probing

## SIGLStudio

Current behavior:
- emits structured export payload from `MandalaFrame`
- payload is inspectable JSON artifact
- no live socket/session bridge

Future:
- negotiated live transport and timeline sync

## Design principle

Every integration module in v0.1 must be truthful:
- expose what exists
- clearly mark what is planned
- keep local behavior deterministic when dependencies are absent

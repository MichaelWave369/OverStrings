# Integration Notes (v0.1.0-alpha)

## Trellis

Current behavior:
- reports discovery/install hook intent
- no runtime coupling or fake daemon process

Deferred:
- explicit driver contract and capability probing
- live runtime bridge

## SIGLStudio

Current behavior:
- emits structured export payload from `MandalaFrame`
- payload is inspectable JSON artifact
- no live socket/session bridge

Deferred:
- negotiated live transport and timeline sync
- live bridge implementation

## Honesty principle

Integration modules in v0.1.0-alpha must clearly distinguish implemented behavior from deferred behavior.

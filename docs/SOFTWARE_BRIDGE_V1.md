# OverStrings Software Bridge v1

OverStrings Software Bridge v1 is a truthful **software-first resonance bridge**.

## Current runtime flow

1. Accept a safe runtime payload (`RuntimeEventPayload`).
2. Validate required/optional fields and bounded values.
3. Resolve family with deterministic mapping rules.
4. Emit a software response over selected transport (`mock` fully supported now).
5. Publish a safe `ResonanceRuntimeState` snapshot.

## Mapping rules (v1)

- Gate 65 → `anchor_warm`
- Gate 68 → `primebeat_pulse`
- Gate 69 → `shield_shell`
- Gate 71 → `spiral_invoke`
- Oracle-enabled follow-on (`oracle_enabled=true` + `runtime_mode=oracle|oracle_follow_on`) → `oracle_glow`
- Degraded/fallback payloads (`degraded_used=true` or `fallback_state != none`) → `recovery_baseline`

Explicit family hint is supported when it is valid and safe.

## Transport scope

- `mock`: implemented and used for local operation/demo.
- `serial` / `osc` / `midi`: scaffolded, return `not_implemented_yet`.

## Integration readiness notes

### PhiVeil → OverStrings

PhiVeil should call the bridge with validated payload JSON matching `docs/PAYLOAD_CONTRACT.md`.
No private substrate or crown-jewel harmonic internals are required.

### OverStrings → EnterTheField-Hub

Hub should consume only `ResonanceRuntimeState` fields:

- `resonance_status`
- `active_family`
- `transport_class`
- `response_mode`
- `degraded`
- `fallback_used`
- `last_event_id`
- `last_gate`
- `available`

This keeps operator surfaces safe and private-aware.

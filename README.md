# OverStrings v0.1.0 — Software Bridge v1

OverStrings is currently the **software-first resonance body** in the Parallax stack. In this phase it truthfully provides a local, mock-first resonance bridge that can accept safe runtime events, map them to preset families, emit software responses, and publish operator-safe runtime status.

## What is live now

- Preset family registry for:
  - `anchor_warm`
  - `shield_shell`
  - `primebeat_pulse`
  - `spiral_invoke`
  - `oracle_glow`
  - `recovery_baseline`
- Safe payload contract for PhiVeil-triggered events.
- Deterministic event-to-family mapping with bounded fallback/degraded behavior.
- Software response engine with working `mock` transport.
- Safe runtime state model for future EnterTheField-Hub consumption.
- CLI demo path for payload intake, resonance triggers, and runtime state output.

## Honest scope boundaries

### Implemented
- `mock` transport is operational.
- `serial`, `osc`, `midi` transports are scaffolded and explicitly `not_implemented_yet`.
- No cloud dependency required.

### Not implemented yet
- Full physical instrument/hardware transport runtime.
- Raw substrate/private harmonic internals exposure.
- Full PhiVeil or EnterTheField-Hub runtime integration (only readiness interfaces/docs provided).
- Advanced DSP/performance engine.

## Build and quickstart

```bash
cargo build
cargo run -p overstrings-cli -- --help
```

## Software bridge demo commands

```bash
# Run all bridge families (anchor, primebeat, shield, spiral, oracle, recovery)
cargo run -p overstrings-cli -- bridge-demo --scenario all

# Run individual demos
cargo run -p overstrings-cli -- bridge-demo --scenario anchor
cargo run -p overstrings-cli -- bridge-demo --scenario spiral
cargo run -p overstrings-cli -- bridge-demo --scenario degraded

# Process a safe payload directly
cargo run -p overstrings-cli -- bridge-event --transport mock --payload '{"event_id":"evt_001","gate":"gate_71_spiral","preset_family_hint":"spiral_invoke","intensity_class":"medium","transport_class":"mock","degraded_used":false,"fallback_state":"none","oracle_enabled":true,"runtime_mode":"oracle"}'

# Print safe bridge runtime state
cargo run -p overstrings-cli -- bridge-state --transport mock
```

## Core docs

- `docs/SOFTWARE_BRIDGE_V1.md` — software bridge architecture and event flow.
- `docs/PAYLOAD_CONTRACT.md` — safe event payload schema and validation.
- `docs/PRESET_REGISTRY.md` — public preset family registry.
- Existing docs in `docs/` still describe seed engine, continuity, and integration posture.

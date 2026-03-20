# OverStrings Architecture (v0.1.0)

## Workspace

- `crates/overstrings-core`: domain model + deterministic engine logic.
- `crates/overstrings-cli`: command interface, formatting, and local artifact wiring.

## Core modules

- `core::engine` — `ResonanceEngine` orchestration across pulse, tuning, mandala, continuity.
- `core::tuning` — `TuningProfile` and golden-ratio frequency ladder generation.
- `core::continuity` — deterministic continuity metrics model.
- `resonance::primebeat` — 10 Hz pulse simulation.
- `resonance::cymatic` — lattice generation from pulse/tuning state.
- `mandala::render` — text and JSON fallback rendering.
- `mandala::sigl_bridge` — structured SIGL export payload.
- `shield::orthogonal` — simple protection/config state.
- `integration::{trellis,siglstudio}` — honest integration status/reporting.
- `state::session` — inspectable session persistence.

## Data flow

1. CLI request creates/loads a `Session`.
2. `ResonanceEngine` computes deterministic outputs.
3. Render/export adapters serialize to terminal and `.overstrings/` artifacts.

## Extension points

- Alternate tunings and calibration sources.
- Audio adapters behind feature flags (future).
- GPU/render backends layered after text/JSON fallback remains supported.
- Trellis and SIGLStudio live connectors to replace current report-only modules.

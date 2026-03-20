# OverStrings v0.1.0-alpha

OverStrings is the software soul of the instrument: a local-first, inspectable control surface and resonance engine foundation for the Parallax ecosystem.

## v0.1.0-alpha scope

### Real now
- Runnable Rust workspace with a working `overstrings` CLI.
- Deterministic tuning, pulse, mandala fallback rendering, and continuity diagnostics.
- Local session state and exports in `.overstrings/`.
- Honest Trellis/SIGLStudio status/export modules.

### Intentionally deferred
- Live hardware control.
- Real-time distributed networking.
- Trellis live runtime bridge.
- SIGLStudio live session bridge.

## Build and quickstart

```bash
cargo build
cargo run -p overstrings-cli -- --help
cargo run -p overstrings-cli -- play --profile vineyard --seed 432.0
```

State is stored in `.overstrings/` by default, or choose a custom path with `--state-dir`.

## Command reference

- `overstrings play` — start a local session and persist state.
- `overstrings tune` — compute golden-ratio tuning bands.
- `overstrings mandala` — render textual fallback or JSON export.
- `overstrings pulse` — run deterministic 10 Hz pulse simulation.
- `overstrings continuity` — compute continuity diagnostics from local state.
- `overstrings status` — print concise operational snapshot.
- `overstrings version` — print version/build info.

## Evaluator demo commands

```bash
cargo run -p overstrings-cli -- play --profile vineyard --seed 432.0
cargo run -p overstrings-cli -- tune --seed 432.0
cargo run -p overstrings-cli -- pulse --cycles 12
cargo run -p overstrings-cli -- mandala --format text
cargo run -p overstrings-cli -- mandala --format json --output .overstrings/mandala.json
cargo run -p overstrings-cli -- continuity
cargo run -p overstrings-cli -- status
cargo run -p overstrings-cli -- version
```

## Integration status in this alpha

- **Trellis**: discovery/install-hook intent reporting only.
- **SIGLStudio**: structured export artifact generation only.
- No hidden network daemon and no fake live bridge.

See `docs/` for architecture, CLI behavior, integration posture, tuning formulas, and continuity metrics.

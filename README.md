# OverStrings v0.1.0 (Seed Release)

OverStrings is the software soul of the instrument: a local-first, inspectable control surface and resonance engine foundation for the Parallax ecosystem.

This seed release is intentionally practical:
- **Real today:** a runnable Rust workspace, working `overstrings` CLI, deterministic resonance/tuning/pulse/continuity behaviors, textual and JSON mandala output, local session artifacts, and integration status reporting.
- **Planned later:** live hardware resonance control, full SIGLStudio live bridge, Trellis runtime hookups, and advanced rendering/audio backends.

## Why this release exists

v0.1.0 establishes architecture and developer workflow while staying honest about current capability. It does **not** pretend physical hardware or distributed networking features that are not implemented yet.

## Build

```bash
cargo build
```

Run the CLI:

```bash
cargo run -p overstrings-cli -- <command>
```

## Command reference

- `overstrings play` — start a local live session report and persist session state.
- `overstrings tune` — show golden-ratio anchored tuning bands from a seed frequency.
- `overstrings mandala` — render a textual fallback or export JSON mandala frame.
- `overstrings pulse` — run/report a deterministic 10 Hz PrimeBeat session simulation.
- `overstrings continuity` — compute continuity diagnostics from local state.
- `overstrings status` — concise snapshot of runtime, integration, and shield state.
- `overstrings version` — print version/build information.

## Demo flow

```bash
cargo run -p overstrings-cli -- play --profile vineyard
cargo run -p overstrings-cli -- tune --seed 432.0
cargo run -p overstrings-cli -- pulse --cycles 12
cargo run -p overstrings-cli -- mandala --format text
cargo run -p overstrings-cli -- mandala --format json --output .overstrings/mandala.json
cargo run -p overstrings-cli -- continuity
cargo run -p overstrings-cli -- status
cargo run -p overstrings-cli -- version
```

## Local-first state

OverStrings stores deterministic, inspectable artifacts in `.overstrings/`:
- `session.json` — latest session state snapshot.
- optional command exports such as mandala JSON artifacts.

## Integration status in v0.1

- **Trellis:** discovery/install-hook intent reporting and extension points only.
- **SIGLStudio:** structured export payload generation only.
- **No fake live bridge** and no hidden network process.

## Non-goals for v0.1

- Real-time distributed resonance networking
- Hard GPU renderer requirement
- Physical-hardware lock-in
- Fake Trellis/SIGLStudio live integrations
- Blockchain/token subsystems

See `docs/` for architecture and metrics details.

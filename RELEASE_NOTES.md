# OverStrings v0.1.0-alpha Release Notes

Date: 2026-03-20

## What this alpha is

OverStrings v0.1.0-alpha is the first credible CLI-first software foundation for the instrument stack:
- local-first
- deterministic and inspectable
- architecture-ready for future integrations

## What is fully real in this release

- Rust workspace and crate split (`overstrings-core`, `overstrings-cli`)
- runnable command-line interface
- deterministic tuning, pulse, continuity, and mandala fallback outputs
- session persistence and export artifacts in `.overstrings/`
- CI checks for format, clippy, and tests

## What is intentionally deferred

- live hardware resonance control
- real-time distributed networking
- Trellis runtime bridge
- SIGLStudio live transport

## Evaluator quick demo

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

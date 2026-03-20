# CLI Reference

Binary name: `overstrings`

Global options:
- `--state-dir <PATH>`: override the local artifact directory (default `.overstrings`).

## `play`
Starts/updates session state and prints active profile, seed frequency, render mode, and save location.

## `tune`
Computes a golden-ratio anchored tuning profile from `--seed` (default `432.0`).

## `mandala`
Renders current state as:
- `--format text` (default) terminal fallback
- `--format json` JSON output (stdout or `--output <path>`)

## `pulse`
Simulates deterministic 10 Hz PrimeBeat cycles (`--cycles`, default `10`).

## `continuity`
Prints deterministic continuity metrics from session + pulse state.

## `status`
Concise operational snapshot including integration readiness and shield posture.

## `version`
Build/runtime version metadata.

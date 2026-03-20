# CLI Reference

Binary name: `overstrings`

## `play`
Starts/updates session state and prints active profile, tuning seed, render mode, and shield status.

## `tune`
Computes a golden-ratio anchored tuning profile from `--seed` (default `432.0`).

## `mandala`
Renders current state as:
- `--format text` (default) terminal fallback
- `--format json` JSON output (stdout or `--output <path>`)

## `pulse`
Simulates deterministic 10 Hz PrimeBeat cycles (`--cycles`, default `10`).

## `continuity`
Prints continuity metrics derived from session and pulse characteristics.

## `status`
Concise operational snapshot including integration readiness and shield posture.

## `version`
Build/runtime version metadata.

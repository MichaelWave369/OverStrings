# Changelog

All notable changes to OverStrings are documented in this file.

## v0.1.0-alpha - 2026-03-20

### Added
- Rust workspace with `overstrings-core` and `overstrings-cli`.
- Runnable `overstrings` CLI with commands: `play`, `tune`, `mandala`, `pulse`, `continuity`, `status`, `version`.
- Deterministic local state persistence under `.overstrings/`.
- Golden-ratio tuning profile generation and 10 Hz pulse simulation.
- Mandala text/JSON fallback rendering and SIGLStudio export artifact model.
- Continuity diagnostics and orthogonal shield local-only posture model.
- Honest Trellis and SIGLStudio status modules (no fake live runtime bridge).
- Initial documentation set and CI workflow.

### Changed
- Improved CLI help text and per-command output consistency using stable key/value lines.
- Clarified README quickstart and evaluator demo commands.

### Deferred (intentional)
- Physical hardware control and hard device dependencies.
- Distributed resonance networking.
- Trellis live runtime integration.
- SIGLStudio live bridge.

# Continuity Metrics (Seed)

`ContinuityMetrics` are deterministic and local.

Computed fields:
- `session_age_seconds`
- `pulse_consistency` (0.0..1.0)
- `artifact_integrity` (0.0..1.0)
- `continuity_score` weighted summary
- `notes`

Current formula emphasizes:
- pulse adherence to 10 Hz target
- presence of persisted session artifacts
- stable render mode and profile continuity

These metrics are diagnostic indicators, not security/cryptographic attestations.

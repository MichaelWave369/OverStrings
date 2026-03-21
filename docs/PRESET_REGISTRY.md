# Preset Family Registry (Public/Safe)

This registry is intentionally safe and excludes private harmonic derivation and raw substrate logic.

| Family | Purpose | Character | Allowed intensity | Fallback | Mock mode |
|---|---|---|---|---|---|
| `anchor_warm` | Centered baseline resonance | warm low tone, short pulse, centered/stable | low, medium | `recovery_baseline` | `soft_anchor_pulse` |
| `shield_shell` | Protective containment resonance | denser pulse, constrained shimmer, protective/clamped | low, medium, high | `recovery_baseline` | `shielded_dense_pulse` |
| `primebeat_pulse` | Rhythmic phase/carrier emphasis | rhythmic repeatable pulse signature | medium, high | `anchor_warm` | `primebeat_loop` |
| `spiral_invoke` | Invocation and bloom resonance | rising shimmer, invoke chime, bloom/decay | low, medium | `recovery_baseline` | `spiral_chime_bloom` |
| `oracle_glow` | Reflective oracle follow-on | bell-like reflective tone, lighter/clearer | low, medium | `spiral_invoke` | `oracle_bell_reflection` |
| `recovery_baseline` | Safe degraded fallback resonance | quiet neutral response, reduced energy, settle baseline | low | `recovery_baseline` | `quiet_settle` |

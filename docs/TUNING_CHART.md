# Tuning Chart (Seed)

Default seed frequency: `432.0 Hz`
Golden ratio constant: `φ = 1.61803398875`

The seed profile builds a 7-step ladder:

- step 0: `seed`
- step n: `seed * φ^(n/2)` for expansion bands

This creates musical spacing suitable for deterministic resonance simulation and repeatable testing.

CLI:

```bash
overstrings tune --seed 432.0
```

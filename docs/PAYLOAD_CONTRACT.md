# Safe Payload Contract (PhiVeil → OverStrings)

## Required fields

- `event_id` (string)
- `gate` (string)
- `preset_family_hint` (string)
- `intensity_class` (`low` | `medium` | `high`)
- `transport_class` (`mock` | `serial` | `osc` | `midi`)
- `degraded_used` (bool)
- `fallback_state` (string)

## Optional fields

- `oracle_enabled` (bool)
- `runtime_mode` (string)
- `device_profile` (string)
- `session_id` (string)

## Example payload

```json
{
  "event_id": "evt_001",
  "gate": "gate_71_spiral",
  "preset_family_hint": "spiral_invoke",
  "intensity_class": "medium",
  "transport_class": "mock",
  "degraded_used": false,
  "fallback_state": "none",
  "oracle_enabled": true,
  "runtime_mode": "oracle"
}
```

## Validation behavior

- Missing required fields are rejected.
- Unknown intensity classes are rejected.
- Unknown transport classes are rejected.
- Unknown preset hints are rejected.
- No raw private verifier/substrate values are required.

# OverStrings — Living Gesture Bridge v1 candidate

**Enter the Field / Φ369 Labs · MIT · local-first · browser-ready**

OverStrings combines its existing Rust resonance event bridge with a portable, dependency-free WebXR hand gesture research playground.

**Experimental Quest 3 demo:** https://michaelwave369.github.io/OverStrings/ (after PR merge, Pages workflow success, and GitHub Pages configured for GitHub Actions).

## Browser gesture slice
- Immersive stereo WebXR view of up to 25 actual hand joints per hand, if exposed by the runtime.
- Heuristic open, pinch, grab and point labels. Palm-relative thresholds, dwell, loss recovery.
- Safe mock payload matching the existing Rust RuntimeEventPayload shape.
- Synthetic desktop gesture buttons, explicitly **not physical tracking**.
- No cloud dependency, camera capture API, external SDK or telemetry.

**Not yet verified:** physical Quest 3 comfort, actual tracking accuracy, hand-controller coexistence, game integrations, native tracking enhancement, Wi-Fi sensing or a browser-to-Rust transport. The browser demo presents JSON; it does not execute Rust or real OSC/MIDI/serial.

Read [Gesture Bridge v1 specification and Quest checklist](docs/GESTURE_BRIDGE_V1.md).

## Existing Rust software bridge (preserved)
- Preset families: anchor_warm, shield_shell, primebeat_pulse, spiral_invoke, oracle_glow, recovery_baseline.
- Safe PhiVeil-style payloads and deterministic mapping.
- Local/mock transport works. Serial, OSC and MIDI are still scaffolds and report not_implemented_yet.
- CLI demo: cargo run -p overstrings-cli -- bridge-demo --scenario all
- Browser tests: node --test web/tests/*.test.mjs

## Documentation
- [Software Bridge v1](docs/SOFTWARE_BRIDGE_V1.md)
- [Payload contract](docs/PAYLOAD_CONTRACT.md)
- [Preset registry](docs/PRESET_REGISTRY.md)
- [Gesture Bridge v1](docs/GESTURE_BRIDGE_V1.md)

## License
New/mainline distribution: [MIT](LICENSE), subject to rights-holder review. Old AGPL-3.0-only commits remain available under their historical license. Third-party materials retain their respective terms.

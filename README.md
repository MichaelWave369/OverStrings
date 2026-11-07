# OverStrings — Living Gesture Bridge Rung 5 candidate

**Enter the Field / Φ369 Labs · MIT · local-first · browser-ready**

OverStrings combines its existing Rust resonance event bridge with a portable, dependency-free WebXR hand gesture research playground.

**Quest 3 browser demo:** https://michaelwave369.github.io/OverStrings/ (Rung 5 appears after PR review, merge and successful Pages deployment).

## Rung 7: ΦPose Language — syntax + armed command-intent laboratory
- Define small phrases from **left/right hand poses**, **two-hand chords**, and **wrist swipes**: `L:open > R:pinch` or `L:open+R:pinch > L:point`.
- Pure, bounded local parser and one-shot interpreter. Separate source selection, synthetic opt-in, timeouts, cooldown, and cancellation.
- Live WebXR gestures and provisional wrist movement can feed the Rung 7 studio; synthetic test buttons remain visibly separate.
- Recognized sentences produce **advisory, zero-authority command requests**. With the optional, separately enabled same-origin [PhiOS companion host](https://github.com/MichaelWave369/PhiOS/pull/405), they can request **real PhiShell UI navigation only**. No app launch, OS effect or privileged capability is granted.
- Existing gesture bridge and Mudra Atlas are preserved. Culturally sourced mudras remain **educational references**, not silently redefined command tokens.

[Read ΦPose grammar, integration design, and headset acceptance plan](docs/PHIPOSE_LANGUAGE_V01.md).

**PhiOS connection pilot:** OverStrings [Rung 7b companion PR](https://github.com/MichaelWave369/OverStrings/pull/11) implements an operator-approved popup bridge to safe PhiShell navigation (Home, Research, Build, Ledger, command palette). The host remains disabled by default and requires a separate consent click in PhiOS. Quest multiwindow XR behavior is unverified.


## Rung 5: Host Adapter SDK + local game simulator (PR candidate)
- The dependency-free **HostPreviewAdapter** is a reusable host-side module with allowlisted Spark, BTM, Domistika XR, and Gen.E.Wrist preview actions.
- Every host response requires **a second, explicit one-shot enabling step**, separate from Rung 4 action-intent arming.
- An untrusted advisory intent is checked for host/action pairing, source, bounded age, sequence and cooldown. Synthetic input needs an extra sandbox checkbox.
- The host callback receives only an immutable, minimal preview object. No raw poses, remote requests, persistence, privileged actions or real game commands.
- The browser's new Rung 5 simulator changes its visible stage when an allowed host preview arrives, demonstrating the integration protocol without connecting to any actual game.
- This is **not a security boundary**: same-page JavaScript can forge an event, a source label, timestamps or client-side consent. Host games must implement independent runtime permission checks.

[Host SDK guide, threat model, and test sequence](docs/GESTURE_BRIDGE_V5.md).

## Rung 4: Game Action Bridge — local practice preview (PR candidate)
- Four **allowlisted preview targets**: Spark cast, Break the Matrix interact, Domistika XR stroke and Gen.E.Wrist open.
- Teach a phrase, capture a distinct second take, explicitly **arm one-shot preview**, then manually compare.
- The pure `ActionIntentGate` checks label, source, matched status, comparison distance, cooldown and manual origin. Arming resets after every attempted comparison, successful or not.
- Synthetic demonstrations require a **separate opt-in checkbox**, disabled by default. Settings changes revoke arming.
- On acceptance the browser emits only `overstrings:action-intent` with a versioned, advisory-only identifier. This **does not control any actual game** or grant app permissions.
- The same-page event is not authenticated. Every game must retain its own authority, explicit consent, input validation and safety fallback.
- No network access, tracking upload, persistent gesture/action permissions or automatic detection.

[Read Rung 4 specification and integration contract](docs/GESTURE_BRIDGE_V4.md).

## Rung 3: Liquid Language Lab

- Teach a named movement phrase from an explicitly completed capture or import an exported motion JSON file, with bounded file size and strict schema validation.
- Make a second independent recording and manually compare against the reference. A constrained dynamic time-warping distance of wrist trajectories and palm-relative fingertip paths indicates preliminary similarity, **not calibrated probability**.
- Reject missing/mismatched hands, invalid coordinates, insufficient movement, mismatched data sources and large timing differences. Comparing a recording with itself is refused.
- Local-only, memory-only references. No automatic persistent template storage, telemetry or game-triggering controls.
- Synthetic near-match and reverse demos plus tests are included, but do not validate physical Quest accuracy.

[Read Rung 3 architecture and headset acceptance plan](docs/GESTURE_BRIDGE_V3.md).

## Rung 2: Hand Calibration + Liquid Motion Lab

- Independent **left/right hand** pinch and finger-extension sensitivity, plus configurable gesture dwell and tracking-loss timeout.
- Explicit **Save settings locally** button. Only numerical sensitivity preferences may be stored in browser localStorage.
- **Arm next VR recording** before entering WebXR; the first real tracked hand starts a bounded 20-second motion phrase capture.
- Hand-reported **wrist motion in meters and palm-normalized fingertip paths**, sampled approximately 14 times per second (maximum 300 frames).
- Recording is **in memory only** unless the user explicitly chooses **Export motion JSON**. Clear recording discards it.
- A labeled synthetic desktop example lets you explore the interface before your headset is charged; it is not proof of XR accuracy.
- Pure Node tests for calibration validation, dropout frames, duration bounds, no implicit recording and explicit export.

[Full Rung 2 specification](docs/GESTURE_BRIDGE_V2.md). Recording is not biometric identification, machine-learning training or an accurate high-speed motion-capture system.

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

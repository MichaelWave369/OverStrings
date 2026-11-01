# Living Gesture Bridge v1 — Quest 3 research slice

## Scope
A static, dependency-free HTML/JavaScript WebXR prototype hosted from web/. It reads actual XRHand joint poses exposed to Quest Browser, draws hands stereoscopically, classifies open/pinch/grab/point, and previews a mock event for the existing Rust bridge.

Actual Quest hardware validation and any accuracy improvement remain unverified. No Wi-Fi CSI sensing, OpenXR native engine, controller/hand coexistence integration, machine-learning inference or live Rust/OSC/MIDI/serial output is implemented. Desktop simulation is labeled synthetic.

## Usage
1. If GitHub Pages has been enabled for **GitHub Actions**, open https://michaelwave369.github.io/OverStrings/ in Quest Browser.
2. Enable hand tracking in Quest settings. Press Enter hand-tracking VR.
3. Move hands within view. Blue marks left; amber marks right. The headset draws only actual tracked joint poses.
4. Exit VR using the Quest system UI. If hand tracking is unavailable, the grid remains but no imaginary hands appear.
5. Use labeled synthetic buttons on desktop to test only event routing.

Requires a secure HTTPS context, supported browser/runtime and user activation.

## Portable integration
The pure web/gesture.mjs module exports JOINT_NAMES, BONES, recognizeGesture, GestureTracker and toResonancePayload. Consumers can integrate with their own XRFrame handling in Spark, BTM, Gen.E.Wrist and other WebXR hosts. It is not on a gameplay-critical feedback path; gameplay authority and controller fallback remain with the host.

Local CustomEvent:
- overstrings:gesture detail = {version:1,type:"overstrings.gesture",id,source:"webxr"|"synthetic",handedness:"left"|"right",gesture:"open"|"pinch"|"grab"|"point",phase:"start"|"end"|"lost",timestamp_ms}
- overstrings:resonance-payload detail = existing Rust RuntimeEventPayload JSON shape on start or tracking loss only. No raw coordinates, video frames, biometric logs, accounts or remote calls.

Mapping: open → anchor_warm/gate_65_anchor; pinch → spiral_invoke/gate_71_spiral; grab → shield_shell/gate_69_shield; point → oracle_glow with oracle_enabled; tracking loss → recovery_baseline with degraded=true and fallback_state=tracking_lost.

**Important:** Local payload preview is not a running Rust backend. No physically measured confidence is claimed. Gesture thresholds are heuristics and require hands-on headset tuning.

## Manual acceptance before claiming Quest support
Test left and right hands separately; both hands; different hand sizes; pinch, open, point, grab; momentary occlusion; prolonged loss; recovery without duplicate actions; headset exit/re-entry; controller-only mode; lighting and rapid movement. Record headset firmware/Quest Browser version and actual results; CI synthetic tests cannot substitute for headset measurements.

## License migration
Copyright (c) 2026 Michael Hughes and OverStrings contributors. The new/mainline repository is offered under MIT by its rights holders. Earlier AGPL-3.0-only revisions retain their historical license grants. This assumes all copyright holders of included code authorize relicensing; audit any external contributions or copied material before final approval.

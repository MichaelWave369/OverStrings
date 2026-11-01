# OverStrings Rung 2: Hand Calibration & Liquid Motion Lab

## What is implemented
- Independently adjustable pinch and extension classification thresholds for left and right hands, plus global dwell / lost-tracking timing.
- Default values preserve v1 gesture recognition. Adjusting sensitivity clears active gesture state to prevent stale actions.
- Explicit opt-in browser-local persistence for **settings only**. If storage is blocked or malformed, valid defaults are used.
- Explicit local motion recording: **arm before VR**, first valid tracked hand starts; captures at most 20 seconds and 300 samples, ending on stop, timeout, or XR session end.
- Samples contain headset-reported wrist displacement from the first accepted sample (meters) and per-hand fingertip position relative to the wrist / palm width. A missing hand is recorded as null, never guessed.
- Export JSON only via user click; no network, remote app, account, raw camera access or automatic movement storage.
- Labeled synthetic example for desktop UI and tests. Synthetic data must never be presented as headset evidence.

## Browser UX
1. Select **Left hand** or **Right hand** and adjust pinch tolerance / extension threshold. A larger pinch tolerance accepts greater thumb-index distance.
2. Dwell controls how long a new shape must remain stable before firing. Loss timeout controls when an interrupted tracked gesture ends.
3. Click **Save settings locally** only if desired. Use Reset to discard settings and remove the local saved profile.
4. Click **Arm next VR recording** before **Enter hand-tracking VR**. Move hands normally; recording begins on first valid tracked hand and stops automatically at the duration or sample cap.
5. Exit the headset session to inspect a browser preview of the wrist paths. Click **Export motion JSON** to retain a private artifact, or **Clear recording** to discard it.
6. **Make synthetic demo** is a completely separate test path (no headset sensor used).

## Motion export shape (v1)
- schema: overstrings.motion.v1
- source: webxr OR synthetic, never silently combined
- coordinate_convention: wrist delta meters; tips relative to wrist divided by palm width
- duration_ms; sample_interval_ms; frames[]
- Each frame: t_ms; hands.left / hands.right = null when untracked, otherwise {wrist_m:[x,y,z], fingertips_palm_units: {"thumb-tip":[x,y,z], ...}}.
- Exported motion data can reveal details about how a person moves. Treat files as private; do not upload by default.
- Current coordinates use the XR reference frame. No wrist orientation compensation, high-speed tracking or hand-identity guarantees are claimed.
- Motion export is a recording format only; no learned gesture template recognition or replay inside games yet.

## Honest hardware boundaries
- No claim of extra precision beyond WebXR-provided XRHand joints.
- Quest 3 hardware acceptance, gesture threshold tuning, real-time frame stability, left-hand handedness behavior, rapid occlusion and multiuser recordings require physical tests.
- No Wi-Fi CSI sensing, always-on recording, background monitoring, OS-wide gesture hooking, BTM/Spark integration, runtime Rust bridge or new hardware dependencies.

## Tests and next rung
CI: node --check on all modules, node --test web/tests/*.test.mjs, existing Rust check, clippy and tests.

When Quest hardware is available:
- Confirm no recording unless armed; arm and exit immediately with no hands; arm and capture both hands; short occlusions; longer losses; 20-second stop; manually stop; clear; export; reload and confirm only user-saved sensitivity remains.
- Test near and far movement, left and right separately, and ensure gestures cannot trigger repeated game actions across tracking loss.
- Consider motion phrase recognition only after actual sample recordings demonstrate useful, repeatable trajectories, with explicit opt-in training and per-app permissions.

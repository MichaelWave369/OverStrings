# OverStrings Rung 3 — Liquid Language Lab

## Goal
Compare independent hand-motion recordings and support custom named *motion phrases* using a local deterministic sequence-distance algorithm. This is an experimental recognition prototype, not person identification, a trained machine-learning model or a confidence estimator.

## Implemented
- Pure JavaScript parser/validator for existing `overstrings.motion.v1` exports. 250 KB text limit; 8–300 strictly ordered frames; known source and coordinate convention; finite bounded 3D vectors and named fingertips.
- Explicitly reject incompatible capture sources (synthetic vs WebXR), different active hands, insufficient movement, large duration disparities and missing tracking data.
- 28 time-resampled samples and constrained-band dynamic time warping over wrist paths and palm-relative fingertips. Provisional threshold 0.38. The output is a **distance** (lower = closer), not confidence.
- Explicit "Use recording as reference", "Import motion JSON", "Compare with reference" and "Forget reference". References live in memory, with no automatic persistence.
- UI refuses identical self-comparison. An independent second capture is required.
- An advisory, explicitly user-triggered `overstrings:phrase-comparison` event has label, source, boolean, reason, and numeric distance, never raw hand coordinates. It grants no app permissions or gameplay control.
- Synthetic reference/near-match/reversed examples for development without a headset.

## Workflow
1. Record a phrase on Quest 3 (arm, enter VR, move, exit) or press **Synthetic reference** on desktop.
2. Click **Use recording as reference** or import a saved motion JSON. The selected reference stays in memory.
3. Click **Clear recording**. Make a second actual take, or create **Synthetic similar take** / **Synthetic reversed take** for a desktop demonstration.
4. Click **Compare with reference**. Matching is a provisional thresholded trajectory distance.
5. Click **Forget reference** to discard the template, and clear the current capture separately. Reloading loses both.

## Safety and truthfulness
- No browser-to-Rust runtime, no real-time learned gesture detection, no always-on hand capture, no Wi-Fi CSI sensing, no cloud upload, no fingerprint/person verification and no game actions.
- Older v1 and v2 capture features and Rust software bridge remain intact.
- Only numeric sensitivity settings saved via the existing explicit Rung 2 control can persist in browser localStorage.
- A movement file may reveal personal motion characteristics; exported JSON should be treated as private.
- Real Quest 3 accuracy, jitter, occlusion handling and the choice of threshold still require physical testing. No synthetic CI result establishes hardware accuracy.

## Acceptance checks
- CI must pass Node gesture, motion, calibration and phrase parser/comparison tests, JS syntax, Rust format/Clippy/tests.
- Desktop: synthetic reference > teach > clear > synthetic similar > compare should indicate similarity; reverse should reject; self-comparison must be refused; malformed file import must be rejected; reload must clear reference.
- Headset: capture two independent one-hand and two-hand phrase performances, repeat with occlusions and different speed, record false positives/negatives. Do not connect this to game actions until measured behavior supports it.

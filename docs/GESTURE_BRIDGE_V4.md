# OverStrings Rung 4: Sovereign Game Action Bridge (advisory sandbox)

## What ships
A pure browser `web/action-gateway.mjs` and practice panel that can translate **manually verified** Rung 3 phrase comparisons into bounded local preview intents.

Allowed action IDs:
- spark.cast — SparkTheSubstrate: cast preview
- btm.interact — Break the Matrix: interact preview
- domistika.stroke — Domistika XR: stroke preview
- genewrist.open — Gen.E.Wrist: open tool preview

**No target game integration is implemented.** The action IDs are an interoperability vocabulary, not executed commands.

## User sequence
1. Record or import a valid reference in Rung 3.
2. Clear the recording and make a second, independent take.
3. In Rung 4, choose an action and explicitly press **Arm one-shot preview**. Default is disarmed.
4. Optionally tick **Allow synthetic recordings in sandbox preview** to exercise the system with desktop demo recordings. Otherwise synthetic comparison never yields an intent.
5. Press **Compare with reference** in Rung 3. One comparison consumes the arming attempt even if rejected.
6. Check the local journal. To try again, arm again manually.

## ActionIntentGate checks
- Known action ID (hardcoded allowlist), nonempty 60-character reference label, source webxr or synthetic.
- Source and label equal to the configured reference. Browser adapter also checks its reference revision has not changed since arming.
- Manual Rung 3 event type/version; matched true, reason similar, finite score 0–0.38; bounded maximum score 0.38 and minimum cooldown 250 ms (default 1200).
- Arming is one-shot and cleared on both valid and rejected comparison. Reconfiguring changes or clears authorization.
- Synthetic source is denied unless the separate demo checkbox is explicitly enabled.
- Emits event `overstrings:action-intent` with detail:
  {schema:"overstrings.action-intent.v1",version:1,advisory:true,mode:"practice",action_id,template_label,source,sequence,timestamp_ms}.
- No raw positions, full frames, account IDs or network targets in intent.

## Security, privacy and honest scope
The browser CustomEvent bus is **not authenticated**. Other same-origin scripts could forge it. Never treat a synthetic event, numeric phrase distance, client arming state or label as identity verification or permission to perform privileged actions. Any integrating game must verify its own real-world permissions, preserve user input safety, apply its own anti-spam/cooldown constraints, and decide explicitly if a preview should cause a non-destructive action.

This PR does **not** add live/automatic gesture matching, actual game controls, Wi-Fi CSI sensing, hardware precision improvements, networking, remote telemetry, background listening, persistent biometric storage, or a Rust runtime connection. The only browser storage remains the user-saved numeric Rung 2 sensitivity profile.

## Verification
CI runs Rust format/clippy/tests, JavaScript syntax, action gate tests and all earlier gesture/motion/phrase tests.
Manual desktop: generate synthetic reference, learn, clear, generate synthetic similar, check opt-in gate, arm, compare, inspect one advisory intent. Try comparing again without arming; there must be no second intent. Change target mid-arming; old authorization must be cleared. Synthetic disallowed by default. Reverse takes must reject.
Quest checks after physical headset validation: record two independent WebXR movements, compare, inspect advisory event only, note false positives and latency. Real game actions are expressly out of scope until headset results justify a separate integration PR.

# OverStrings Rung 5: Host Preview SDK and Integration Starter

## What it is
A dependency-free, MIT-licensed, pure-JS host adapter that translates an OverStrings advisory action-intent into a harmless, explicitly approved local preview. No target game is connected by this change. This is not automatic gesture recognition, a physical Quest 3 validation, or a privileged action interface.

## Host allowlist
- spark -> spark.cast (Spark casting preview)
- btm -> btm.interact (Break the Matrix interaction preview)
- domistika -> domistika.stroke (Domistika XR drawing preview)
- genewrist -> genewrist.open (Gen.E.Wrist menu preview)

## API
Import HostPreviewAdapter, HOST_ACTIONS and HOST_LABELS from web/host-sdk.mjs. Construct with onPreview, then configure with a hostId and source. Only from an explicit user click, call arm(). When a local Rung 4 action-intent is emitted, pass it with performance.now() to accept(). One accepted or rejected attempt disarms. The callback receives a frozen preview-only value with schema, host_id, action_id, label, source, template_label and sequence.

Example for a hypothetical local practice app:

    const host = new HostPreviewAdapter({onPreview: result => log(result.action_id)});
    host.configure({hostId:'spark',source:'webxr'});
    host.arm(); // call ONLY after user's explicit click
    host.accept(advisoryIntent, performance.now()); // preview only

## No-headset smoke test
1. In Rung 2, make Synthetic reference; in Rung 3, Use recording as reference; then Clear recording and make Synthetic similar take.
2. In Rung 4, choose Spark cast, check synthetic sandbox mode, and Arm one-shot preview.
3. In Rung 5, select Spark / Synthetic desktop demo, check synthetic practice permission, and Enable one host preview.
4. Click Compare with reference in Rung 3. The Rung 4 journal should show one advisory intent and Rung 5 should show one simulated spell spark.
5. Repeating without rearming must do nothing. Change host/source after arming, try an incompatible game, or compare a reversed phrase to confirm rejection.

## Privacy and security boundaries
- Same-page CustomEvents, source labels, action intents, timing and JS consent state are NOT authenticated. Same-origin scripts can fabricate them. The SDK provides input validation and an intentional UX gate only.
- There are no cross-origin messages, network calls, remote controls or raw hand coordinates in host previews. All stage changes are local and synthetic.
- Every real game must independently confirm its permissions and trust boundary, maintain the original controller path, use revocable user consent and enforce its own state/anti-spam measures.
- Synthetic test permission is disabled by default and must never be interpreted as a real WebXR hand observation.
- Real Quest 3 accuracy, false-positive rates and latency remain unverified until physical testing.

## Acceptance
CI runs JS syntax and Node tests including host SDK failures, plus existing Rust format/Clippy/tests. Manual browser tests cover opt-in, host/source changes, stale/replayed intent rejection and no automatic gameplay actions. Follow-up integrations into individual games should use separate reviewed PRs.

# OverStrings Rung 7: ΦPose Language v0.1

## Purpose

Translate **deliberate, user-armed gesture sentences** into bounded, inspectable, **advisory command requests** suitable for future review by PhiOS and individual apps. This rung delivers an actual parser, stateful interpreter, wrist-motion tokenizer, and a browser studio for live WebXR/synthetic input. It deliberately **does not yet send commands into PhiOS**, install an app, or grant execution authority.

A meaningful visual control experience is not the same thing as uncontrolled OS automation. PhiOS already defines governed permissions, capabilities, and action leases, so the eventual host adapter must integrate with those controls and **not** bypass them.

## Grammar

This is **our engineering DSL**. It is not an invented reconstruction of a historical or sacred mudra language.

```ebnf
sentence = step , ">" , step , { ">" , step } ;
step     = token | token , "+" , token ;
token    = hand , ":" , symbol ;
hand     = "L" | "R" ;
symbol   = "open" | "pinch" | "grab" | "point" | "swipe-left" | "swipe-right" ;
```

- `L:open > R:pinch`: left open, *then* right pinch.
- `L:open+R:pinch > L:point`: two-hand chord, *then* point.
- `R:point > R:swipe-left`: point, *then* leftward wrist motion.
- A sentence has **2 to 5** steps. A chord contains at most two tokens, one per hand.
- The user must explicitly configure and arm **one** phrase. A valid completion consumes the arming; an unexpected start, invalid source/event, stale event, timeout or tracking loss cancels it.
- Per-step timeout 1.8s; whole-phrase timeout 6.5s; chord window 450ms; success cooldown 1.2s. These are **provisional**, not hardware-calibrated.
- Valid token streams come from existing `GestureTracker` debounced WebXR events and a new explicit wrist swipe tokenizer. Pointer/buttons can simulate a token only with a separately opted-in synthetic sandbox source.

## Interface

Open `web/index.html` in Quest Browser over HTTPS. The Rung 7 panel offers a sentence input, allowlisted advisory target, source selector, synthetic opt-in, and an arm/disarm control. Use actual hand tracking inside the VR session or the separately labeled synthetic buttons. The output JSON is a **safe local preview**, never a host execution receipt.

```json
{
  "schema":"overstrings.phipose.intent.v0.1",
  "version":1,
  "advisory":true,
  "action_authority":false,
  "execution_authority":false,
  "action_id":"phios.view.research",
  "source":"webxr",
  "program":"L:open > R:pinch",
  "sequence":1,
  "timestamp_ms":12345
}
```

The event name is `overstrings:phipose-intent`. **No raw hand joints** are exported in intent. This event is same-page and forgeable. It is not a host credential or authentication token. The source tag is informative, not proof of physical presence. The host must not execute effects on the strength of this event.

## Safe command namespace (v0.1)

- `phios.view.home`
- `phios.view.research`
- `phios.view.build`
- `phios.view.ledger`
- `phios.command.open`

These strings are **proposal IDs only**, not wired PhiOS actions. No arbitrary host command, app URI, shell execution, filesystem operation, delete action, credentials, payments, networking changes, or privileged APIs are accepted.

### Real PhiOS host adapter (proposed Rung 8)

1. Add an in-origin PhiShell gesture input adapter with exact app/source/session registration and an explicit, revocable operator enable switch. A standalone GitHub Pages app cannot simply claim host authority through `postMessage`.
2. Bind only **safe foreground UI navigation** to typed `ShellEvent` reducers (`SET_VIEW`, `OPEN_COMMAND`, etc). The user should see which gesture is bound and retain keyboard/mouse/controller access.
3. Require independent human consent per app and per command class. Actions with environmental effects go through PhiOS governed capability and action lease mechanisms. A gesture is never a substitute for authentication.
4. Implement host-side replay rejection, focus/input capture checks, explicit origin+source binding for any cross-window use, per-command timeouts, and a visible emergency disable shortcut.
5. Keep command receipts separate: `recognized`, `host accepted`, `effect completed` are not synonyms. Never claim an app action succeeded because the interpreter emitted an advisory request.
6. Actual XR adoption needs camera/tracker availability testing on Quest 3, confusion matrices across users/hand sizes, false activations, tracking-loss behavior and accessibility alternatives.

### Cultural atlas relationship

The Rung 6 Mudra Atlas is an **educational, sourced catalogue**, not the grammar. Traditional gestures retain their historically specific meanings and should never be silently mapped to modern software verbs. A future pose-token package may offer opt-in source-labeled gesture variants, each with independent physical calibration and a reviewer-approved mapping. Finger circles that resemble `pinch` are **not automatically** `Chin`, `Gyan`, or `Vitarka`.

## Tracking details and limitations

WebXR Hand Input defines 25 joints per hand. Meta Quest Browser can expose those joints for WebXR scenes. See:
- W3C draft: https://www.w3.org/TR/2026/WD-webxr-hand-input-1-20261029/
- Meta developer guide: https://developers.meta.com/vr/documentation/web/webxr-hands/

The wrist swipe tokenizer observes horizontal X translation relative to the WebXR reference space, **not gaze-relative left or right**. It only considers an already recognized `open` or `point` pose, requires a minimum ~15 cm horizontal movement in 150–800ms, and latches until the hand rests/reset. It is **experimental**, not a claim of physical calibration. Motion may be missed or confused by occlusion and user orientation.

## Privacy and security

- Explicit one-shot arming; no passive gesture-to-command automation.
- Synthetic demo disabled by default; changing settings cancels prior arming.
- No network I/O, camera API, account identity, biometric enrollment or persistent gesture templates in Rung 7.
- No arbitrary code evaluation, host privileges, arbitrary app endpoints or browser-to-PhiOS transport.
- Same-origin JS may spoof CustomEvents or source flags. Never treat this page as an authorization/security boundary.
- Existing Rung 4/5 preview adapters and other integrations remain unchanged.
- If a headset loses tracking during an active phrase, the interpreter cancels it. Hardware acceptance is still pending.

## Verification

```bash
node --test web/tests/*.test.mjs
```

Tests cover parser injection/rejection, bounded grammar, two-hand chord order/window, source/opt-in gates, timeouts, stale samples, cancellation, one-shot and cooldown, zero authority, and wrist swipe tokenization. GitHub CI supplies automatic unit checks but does not prove hardware functionality or PhiOS host integration.

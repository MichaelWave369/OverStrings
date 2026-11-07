# OverStrings Rung 8 · ΦPose Universal Gesture Vocabulary v0.1

## Goal

Make the ΦPose gesture language **composable across apps** without turning a gesture dictionary into an operating-system privilege source. OverStrings remains the gesture/phrase input engine; each application owns its contextual vocabulary; PhiOS or the application's own host must make an independent permission decision before effects.

**Implemented in this rung:** data-only vocabulary manifests, a strict compiler, namespace and phrase-collision validation, bundled examples for PhiOS/PhiOffice/Domistika XR/Gen.E-Wrist, an importable JSON format, and a live scoped action picker in the Rung 7 practice studio. App-specific imported commands remain **advisory previews only**. The existing reviewed PhiOS Shell companion remains the only actual UI-navigation adapter.

## Format

See `examples/phipose-field-notes.v01.json` for an importable sample.

```json
{
  "schema": "overstrings.phipose-vocabulary.v0.1",
  "app_id": "field-notes",
  "title": "Field Notes Practice",
  "version": "1.0.0",
  "commands": [
    {
      "id": "field-notes.page.next",
      "label": "Next Note",
      "description": "Suggest viewing the next note, without executing an app action.",
      "script": "L:open > R:swipe-right",
      "mode": "preview_only"
    }
  ]
}
```

The `script` uses the already documented Rung 7 grammar. In addition to single-hand tokens, it may contain two-hand chords like `L:open+R:pinch` and ordered sequences using `>`.

### Schema gates

- Size limit: 20 KB of JSON text. No embedded code, URLs, executable commands or unknown fields.
- Bounded app ID and command IDs: action IDs must share the declared `app_id` prefix. Up to 12 commands per app vocabulary.
- Bounded title, version, label, description and phrase; Semantic Versioning-shaped `major.minor.patch` version.
- All phrases parse through `parsePhiPose()`. Chords normalize hand order.
- Commands in the **same app scope** must not have identical or prefix-overlapping gesture sentences. Prefix ambiguity would allow the shorter command to finish while the longer is still underway.
- Reusing a phrase across **different** app scopes is valid because the operator selects the active app explicitly.
- Imported manifests cannot use `phios`, `system` or `operator` as their namespace and cannot shadow a bundled or previously imported scope.
- Imported commands must be `preview_only`. Only the bundled reviewed PhiOS command list is eligible for `shell_ui`. Even that does not provide OS authority.
- Import happens only on a file selection. It stays in memory and vanishes on refresh. No install, auto-discovery, upload, background gesture monitoring, permission persistence, or auto-run.
- The code treats all manifests and custom gestures as **untrusted descriptions**.

### App bindings versus capability grants

```text
Tracked joints / explicit synthetic practice
     ↓
OverStrings debounced pose / wrist-motion tokens
     ↓
ΦPose interpreter (armed, one-shot, bounded)
     ↓
Scoped vocabulary ID + typed advisory request
     ↓
HOST-SPECIFIC TRUST + PERMISSION BOUNDARY
     ├─ PhiOS Shell: separately approved Home/Research/Build/Ledger navigation only
     ├─ PhiOffice: preview only, no editor wiring in this rung
     ├─ Domistika XR: preview only, no brush commands in this rung
     └─ Gen.E-Wrist: preview only, no wrist menu commands in this rung
```

A JSON manifest is **never** an installation credential, host registration, authorization receipt, execution lease or a proof of bodily intent. The `mode` field does **not** authorize execution: it can describe whether a bundled command has a separately implemented *UI-only* host route. The actual transport still has a hardcoded allowlist and validates its own session.

### Usage

1. Open the OverStrings browser playground.
2. In **ΦPose Language**, choose an app under **Active application vocabulary**, then pick a listed action.
3. The example phrase populates automatically. You may edit it before arming the one-shot interpreter.
4. Set `Synthetic` + enable demo input, or use real WebXR hand tracking. Perform the ordered tokens or tap the labeled synthetic token buttons in desktop practice.
5. PhiOS actions can be sent only if the separate same-origin PhiOS companion is explicitly enabled in its own window. All other app actions display an advisory preview and never execute.
6. To test a new app vocabulary, explicitly select an importable JSON file (max 20 KB). It is added to the local selection list without persistence.

A sample vocabulary is **not** an implemented integration with that app. Source tracking, accessibility, calibration, focus checks, and physical headset acceptance remain necessary.

## Research and cultural boundaries

Rung 6 Mudra Atlas retains culturally grounded source and meaning data independent of ΦPose command tokens. Historical gestures are not silently used as generic UI shortcuts. Future research pose definitions require cultural review, lineage/variant labels, independent physical calibration, and explicit opt-in bindings.

## Next rung: reviewed app host SDK

For PhiOffice, Domistika XR, Gen.E-Wrist, and other apps, a reviewed host should:
- Publish a static, scoped vocabulary with provenance and version;
- Independently register a known source (origin/frame/session), obtain per-app operator consent, manage focus and revocation, apply replay/cooldown checks;
- Allow only known safe UI actions at first; use existing PhiOS capability/ActionLease/Spine gates for persistent or dangerous effects;
- Show operator-readable receipts that distinguish `recognized`, `accepted`, `performed`, `denied`, and `unknown`;
- Retain keyboard/controller input and a fast exit path, and test actual Quest hand/controller coexistence.

## Verification

```sh
node --test web/tests/*.test.mjs
```

The focused Rung 8 tests cover manifesto field validation, size bounds, reserved namespaces, action ID duplication, semantic phrase prefix collisions, separate app scopes, immutable source descriptions, and authority flags. CI covers deterministic logic, **not** successful real XR recognition or external app control.

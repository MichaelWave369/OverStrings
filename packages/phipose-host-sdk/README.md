# ΦPose Host SDK v0.1

**Rung 10** · Portable, zero-authority receiver for app-scoped gesture command requests.

This package extracts the repeated validation logic from the PhiDeck pilot into a reusable ESM module with **no runtime dependencies**, network requests, browser event listeners, storage, or user identity assumptions.

## API

```js
import {ScopedPhiPoseHost} from '@phi369/phipose-host-sdk';

const host = new ScopedPhiPoseHost({
  appId: 'myapp',
  protocol: 'myapp.gesture-nav.v0.1',
  actionIds: ['myapp.view.next','myapp.view.previous'],
  guard(actionId, context) {
    // Pure denial logic. Does not execute effects or grant privileges.
    if (!context?.focused) return 'not_focused';
    if (actionId === 'myapp.view.next' && !context.hasNext) return 'at_end';
    return null; // allow only after all context-specific checks pass
  }
});

// ONLY after an explicit user click, in the real reviewed app:
host.enable({
  source: reviewedOpenerWindow,
  origin: 'https://example.test',
  sessionId: crypto.randomUUID(),
  expiresAt: Date.now() + 5*60_000,
  allowSyntheticDemo: false
}, Date.now());

// Your app owns the window message listener and foreground UI dispatch:
const decision = host.accept(event, Date.now(), {
  focused: document.hasFocus(),
  hasNext: true
});
if (decision.accepted) {
  // ONLY a separately reviewed, benign UI action. No execution in the SDK.
  if (decision.actionId === 'myapp.view.next') selectNextItem();
}
host.revoke();
```

The import above describes the intended package API. This monorepo package is **private / not yet published**. For the current PhiOffice pilot the reviewed source is vendored as a byte-identical snapshot rather than downloaded at runtime; refer to the integration PR.

## Envelope contract

The SDK recognizes **only** the fixed `overstrings.phipose.intent.v0.1` advisory envelope within a host-specific `<app>.gesture-nav.v0.1`-style protocol. It requires:
- A host operator-enabled session for exactly one source window, exact origin and random UUID, with a maximum five-minute lifetime.
- An exact packet field list; no file paths, extra fields or covert privileges.
- An exact intent field list; `advisory: true`, `action_authority: false`, `execution_authority: false`.
- A valid, canonical grammar sentence, two to five ordered steps, no duplicate hands in a chord.
- App-prefixed allowlisted command IDs, numeric sequence monotonicity, cooldown and message freshness.
- Separate host opt-in for synthetic demo input.
- A caller-owned, context-specific pure denial guard. Guard exceptions deny.
- Revocation on operator disable, owner component teardown, navigation, and session expiry.

SDK output is a **decision record, not an effect**: `{accepted:true,reason:'accepted_for_ui_dispatch',actionId,sequence,execution_authority:false}`.

The SDK does not attest that a physical user actually performed the gesture. Browser `postMessage` sources, same-origin scripts, and source labels are **not cryptographic trust boundaries**. The host must not treat this as authentication or as a grant of filesystem, shell, application, identity, network or persistence capabilities.

## App-host integration checklist

1. Define your own reviewed app ID and **fixed command allowlist**. Do not derive it from imported vocabulary JSON or a remote provider.
2. On an operator click, vet the opener's **exact pathname/origin** and create a fresh UUID; never enable merely because a packet arrived.
3. Use `enable()` with a source window and exact origin; do not use wildcard `postMessage('*')`.
4. On every `message` call `accept()` with real current app state. Keep **performing** the UI action outside the SDK and inside an explicit allowlisted switch.
5. Report `accepted_for_ui_dispatch`, not `effect_completed`, unless you independently verify the effect.
6. Retain keyboard/controller alternatives, and a visible **Disable** action. If the editor closes, revoke.
7. Keep app-specific permissions for edits, writes, exports, payments, network and other consequential effects out of this UI-only SDK. If necessary later, route through the existing PhiOS governed ActionLease path.
8. Test desktop browser and Quest hand/controller behavior. Unit tests **cannot** establish real XR correctness or cross-window responsiveness.

## Provenance and practical distribution

- Canonical checked-in source: `packages/phipose-host-sdk/index.mjs`.
- PhiOffice vendor snapshot: `apps/web/src/lib/phiPoseHostCore.js` in `MichaelWave369/phioffice369`.
- Verified byte-identical Git blob for this Rung 10 candidate: `46d852582327d38966fdb01aace666bd3f9cd9cd`.
- PhiOffice's `tests/phipose-host-core.test.js` pins that Git blob SHA offline. Review both repos before bumping the vendored source. No runtime package download or SaaS dependency is introduced.

## Verification

```sh
node --test web/tests/*.test.mjs
```

The SDK tests cover strict scopes, canonical parser, origin policy, session expiry/replay, malformed envelopes, source isolation, synthetic denial, context guards and zero-authority outputs.

This is an engineering vocabulary, not an alleged universal historical mudra language. The source-linked cultural Mudra Atlas remains distinct.

# OverStrings ΦPose Rung 12 · Domistika XR Companion

This rung expands the common gesture language into **Domistika XR** for *reviewed, consented, reversible UI navigation*.

The existing OverStrings grammar/interpreter and source-backed Mudra Atlas remain unchanged. Historical mudra names are not reassigned to software control. A new built-in Domistika vocabulary extends the existing brush descriptions with five Studio Room destinations, but the vocabulary remains **data-only / preview_only**. The independently reviewed Domistika host determines which commands are actually allowed.

## Built-in commands

| ID | Phrase | Meaning |
| --- | --- | --- |
| `domistika.brush.next` | `L:open > R:swipe-right` | Next brush in current painting room |
| `domistika.brush.previous` | `L:open > R:swipe-left` | Previous brush |
| `domistika.room.home` | `L:open > R:grab` | Studio Home |
| `domistika.room.canvas` | `L:point > R:open` | Canvas Studio |
| `domistika.room.spatial` | `L:point > R:grab` | 3D Painting |
| `domistika.room.workshop` | `L:grab > R:open` | Sculpture Workshop |
| `domistika.room.gallery` | `L:grab > R:pinch` | Art Gallery |

The original `domistika.palette.open` remains preview-only, unsupported by the host. It cannot be sent as a recognized real app command.

## Protocol and operator actions

- Sender: `web/phipose-domistika-transport.mjs`.
- Receiver: Domistika `src/xr/phiPoseDomistikaHost.js`.
- Protocol: `domistika.gesture-nav.v0.1`.
- The user clicks **Open Domistika XR companion** in OverStrings and separately clicks **Enable for 5 minutes** in the Domistika sidebar.
- Sender binds exact same-origin popup/source object, random host-issued session, five-minute expiry and a fixed seven-ID allowlist.
- Host uses the reviewed `ScopedPhiPoseHost` SDK and checks current painting/room state before selecting an action.
- Synthetic demo needs separate checkboxes in **both windows**.
- Only 10 minimal advisory intent fields are sent. No source-tracking joints, project files, art, images, identity, or credentials are transmitted.
- No gestures can create a stroke, erase/delete/save/export art, control audio, install software, launch processes or use operating-system capabilities.

## Live trial

Once *both* PRs merge and Pages deploys, launch [OverStrings](https://michaelwave369.github.io/OverStrings/) → select Domistika XR → **Open Domistika XR companion** → enable that companion inside [Domistika XR](https://michaelwave369.github.io/Domistika/xr.html) → arm a sentence. Start with synthetic buttons on desktop before physical Quest.

This is a cross-window **browser experiment**. Meta Quest Browser may suspend the sender while Domistika is immersive; this rung does not solve that limitation. A subsequent in-origin WebXR gesture tracker is required for standalone, continuous Quest control.

## Verification

```sh
node --test web/tests/*.test.mjs
```

Sender tests cover exact opener/origin, bounded host-approved session, data minimization and denied destructive intents. Host tests separately pin the SDK source and verify that the real app only changes reversible room and brush settings. Hardware/visual qualification remains required.

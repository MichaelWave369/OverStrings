# OverStrings ΦPose Rung 9: PhiOffice Live Slide Navigation Pilot

This rung makes the **first real application UI gesture actions** possible with separately approved, safe PhiDeck slide navigation. It does not grant edit, save, delete, share, export, install or privileged execution.

## Setup

1. Open OverStrings on GitHub Pages; choose the built-in **PhiOffice Preview** vocabulary.
2. Choose **Next Page** (`L:point > R:swipe-right`) or **Previous Page** (`L:point > R:swipe-left`).
3. Click **Open PhiOffice deck companion**. The opener must be the exact same GitHub Pages origin as PhiOffice.
4. In the new PhiOffice window, open or create a **PhiDeck** file, then select **Enable ΦPose deck navigation**. The PhiDeck editor generates a random, five-minute session and sends a `ready` message to the opener. It begins disabled.
5. For a desktop test, choose synthetic input in OverStrings and check **Allow synthetic practice** in *both* windows. Arm the one-shot sentence and click the two matching token buttons in order.
6. For Quest hand tracking, choose the WebXR source and perform the physical sequence. This is still **uncalibrated on real Quest 3 hardware** and dual-window XR may be suspended by Quest Browser.
7. PhiDeck may select the next/previous existing slide only. It declines at slide boundaries and while presentation mode is active. The host emits an accepted-for-UI-dispatch receipt, not a file-edit or OS-effect receipt.

## Contract

- OverStrings sender: `web/phipose-office-transport.mjs`.
- PhiOffice receiver: `apps/web/src/lib/phiPoseDeckHost.js`.
- Protocol: `phioffice.phipose-deck.v0.1`.
- Strict approved commands: `phioffice.page.next`, `phioffice.page.previous`.
- PhiOS Shell and PhiOffice use **separate host sessions, allowlists and action namespaces**.
- The Rung 8 command `phioffice.palette.open` remains **preview-only**.
- The sender transmits minimal `overstrings.phipose.intent.v0.1` data, with no raw hand joints.
- Connection requires an explicit user-opened popup, exact sender window and origin checks, a host-created session, and separate user enablement inside PhiOffice.
- This is **not** a cryptographic trust boundary. A compromised same-origin page could forge messages. Consequential app operations are not exposed.

## Tests

```sh
node --test web/tests/*.test.mjs
```

The sender's tests check same-origin, exact source, session registration, minimized intent payload, disconnected behavior, and rejection of non-slide actions. PhiOffice runs its own independent receiver tests. Actual browser and Quest 3 acceptance remain open qualification steps.

The Rung 6 mudra atlas stays a separate sourced educational library; a cultural gesture name does not automatically imply a PhiOS or PhiOffice command.

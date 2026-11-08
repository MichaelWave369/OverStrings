# OverStrings Rung 11: ΦPose → PhiWrite and PhiGrid

Rung 11 adds **four actual navigation intents**, dispatched only when the user enables an independent, app-specific host inside PhiOffice. It builds on the Rung 10 shared, zero-authority Host SDK already adopted in PhiOffice.

## PhiOffice built-in vocabulary

- `phioffice.write.section.next` = `L:open > R:point`
- `phioffice.write.section.previous` = `L:grab > R:point`
- `phioffice.grid.cell.next` = `L:pinch > R:swipe-right`
- `phioffice.grid.cell.previous` = `L:pinch > R:swipe-left`

Existing `phioffice.page.next` and `phioffice.page.previous` remain the separate PhiDeck slide-navigation pilot. `phioffice.palette.open` remains **preview-only**.

## New host protocol

`phioffice.gesture-nav.v0.1` handles **only** PhiWrite headings and PhiGrid cell focus. The existing `phioffice.phipose-deck.v0.1` is unchanged. A PhiDeck-ready session is not a PhiWrite/PhiGrid session and cannot send actions from the other's allowlist. A new explicit operator enablement in the active editor assigns a host UUID to the matching protocol.

Workflow:
1. On OverStrings, select the **PhiOffice** vocabulary and one of the new commands.
2. Click **Open PhiOffice companion**; open PhiWrite or PhiGrid in the new PhiOffice window.
3. Click **Enable ΦPose** in the active editor; only then will the sender receive a host-generated session.
4. Choose real WebXR tracking or opt in to synthetic practice in **both** pages. Arm one sentence and perform tokens.
5. The host makes a fresh decision about its current editor state, then focuses a heading or visible cell. **No document text, cell values, file contents, or raw hand-joint data are transmitted.**

An imported vocabulary manifest cannot activate a new host action. The OverStrings sender and PhiOffice receiver have separate, reviewed, hardcoded allowlists. Sessions are ephemeral, five minutes maximum, origin+window-source bound, with replay and cooldown checks. This same-origin browser experiment does not cryptographically authenticate a human or guarantee Quest 3 two-window WebXR availability.

## Testing

```sh
node --test web/tests/*.test.mjs
```

Sender contract tests verify switching between separate deck/editor protocols and not allowing a command for the wrong host. PhiOffice has independent tests and full browser/storage CI. Physical Quest 3 tracking, cross-window responsiveness and deployed live UI verification remain open.

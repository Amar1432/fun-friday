# Active Task

**Ticket:** FFH-106
**Title:** Shareable Lobby Links & Auto-Fill

## Objective

Generate instant shareable invite links for hosts to distribute to players.

## Execution Requirements

1. **Copy Invite Link:** The host lobby UI displays a prominent "Copy Invite Link" action button that copies `/room/join?code=D9FD81` to the clipboard.
2. **Auto-Fill Room Code:** When the invite link is opened by a guest, the Room Code field on the Join page is locked/auto-filled, requiring only their display name.
3. **Clipboard UX:** Show a brief "Copied!" confirmation state after clicking the copy button.

## Completion

Once the shareable links feature is implemented and verified, commit the changes, update `docs/HANDOFF.md`, and update this file to point to the next logical step.

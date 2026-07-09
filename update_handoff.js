const fs = require('fs');
const content = fs.readFileSync('docs/HANDOFF.md', 'utf8');

const newEntry = `**Date/Time:** 2026-07-08 19:00 (Local Time)
**Agent:** Antigravity (Jules)
**Ticket:** FFH-098

- **What Changed:**
  - Implemented client-side logic to detect socket connection recovery from a temporary drop and emit a \`ReconnectRequest\` event instead of \`JoinRoom\` in \`apps/web/app/lobby/[roomCode]/page.tsx\`.
  - Fixed a missing dependency constraint bug in the socket reconnect effect.
  - Updated \`StateSync\` event typing in \`types.ts\` and \`use-socket-sync.ts\` to align precisely with the NestJS gateway payload structure.
  - Configured \`syncState\` in the global game store (\`use-game-store.ts\`) to handle the new \`StateSync\` payload format and forcibly clear stale UI state elements (\`submittedAnswer\`, \`timerRemaining\`, \`currentQuestion\`) to guarantee a fresh UI state upon reconnecting.
  - Refactored mock configurations and added tests in \`page.spec.tsx\` and \`use-game-store.spec.ts\` to verify the \`ReconnectRequest\` logic and state clearing logic.
  - Validated that the entire monorepo builds, typechecks, and passes all tests successfully.
- **Why:** To satisfy the acceptance criteria of FFH-098, allowing players dropping from network interruptions to regain connection and sync accurately to the live room state without displaying stale UI variables from a previous round.
- **What's Next:** Start \`FFH-099: Optimize Responsive Layouts\` as part of Epic 23.

---

`;

const headerMarker = '_(Agents: Prepend your latest update to the top of this list. Never overwrite previous entries.)_\n\n---\n\n';

if (content.includes(headerMarker)) {
  const parts = content.split(headerMarker);
  const newContent = parts[0] + headerMarker + newEntry + parts[1];
  fs.writeFileSync('docs/HANDOFF.md', newContent);
  console.log("HANDOFF.md updated successfully.");
} else {
  console.error("Could not find the insertion point in HANDOFF.md");
}

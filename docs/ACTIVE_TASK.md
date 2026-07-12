# Active Task

**Status:** ✅ FFH-135 Complete — Regression validation passed (API 406/406, web 191/191, typecheck/lint/build all green across the workspace).

## Next Logical Step

Sprint 6 (Game Modes & Answer Evaluation, FFH-114–FFH-135) is complete. Begin **Sprint 7** planning. Candidate work:

- **Production deployment hardening** (Vercel frontend + Railway/Render game server; CI already runs typecheck/lint/test/build).
- **Additional game modes** — the `GameModeRegistry` already supports expansion by adding a single entry to the `modes` array (no other code changes needed).
- **Shared answer-validation package** — extract `AnswerEvaluationService` from `apps/api` into `packages/shared` so the frontend could reuse normalization/typo-tolerance if ever needed.

### Proposed Sprint 7 Kickoff Ticket (draft)

**Title:** Plan Sprint 7 — Deployment & Expansion

### Objective

Decide and scope the next body of work: ship the multiplayer hub to production and/or extend the game catalog.

### Acceptance Criteria

- A written deployment plan covering frontend (Vercel) and game server (Railway/Render) with env/config requirements.
- A prioritized backlog for the next sprint (game-mode expansion or shared validation package).
- Updated `docs/TASKS.md` with the chosen epic(s) and ticket stubs.

### Completion

Stage, commit, update `docs/HANDOFF.md`, and update this file to point to the next logical step.

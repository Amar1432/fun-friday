# Active Task

**Status:** 🐛 Build Fix — Found that `nest build` produces zero output files, causing all API modules (Auth, Rooms, Game, Redis) to be missing from `dist/`. Fixed by switching to `tsc` directly.

## What Was Done

- Investigated user report that non-emoji games weren't starting
- Confirmed seed data exists for all 3 games in PostgreSQL ✅
- Found `nest build` was broken — produced no output files due to tsconfig `<code>module:nodenext</code>` + `<code>moduleResolution:nodenext</code>` incompatibility with Angular build system
- Fixed build script: `"build": "rm -rf dist && tsc --project tsconfig.build.json --outDir dist --declaration --sourceMap"`
- Added `.catch()` handlers to `handleDisconnect` to prevent unhandled promise rejections from crashing server
- Browser agent confirmed game flow works for Bad Movie Description (login → create room → join → start game → gameplay loads) ✅

### Remaining Issue

The `dev` script still uses `nest start --watch` which has the same issue as `nest build` (produces no output). Update it to use `tsc --watch` + `node dist/main`.

### Next Logical Step

Fix the `dev` script or investigate the root cause of why `nest build`/`nest start` don't work with the current tsconfig.

Sprint 6 (Game Modes & Answer Evaluation, FFH-114–FFH-135) is otherwise complete. Begin **Sprint 7** planning:

- **Production deployment hardening** (Vercel frontend + Railway/Render game server; CI already runs typecheck/lint/test/build).
- **Additional game modes** — the `GameModeRegistry` already supports expansion by adding a single entry to the `modes` array (no other code changes needed).
- **Shared answer-validation package** — extract `AnswerEvaluationService` from `apps/api` into `packages/shared` so the frontend could reuse normalization/typo-tolerance if ever needed.

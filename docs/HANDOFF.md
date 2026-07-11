# Session Handoff Log

## 🏛️ Project State Summary (Previously Completed)

_(See `docs/archive/SPRINT_1_AND_2_HANDOFF.md` for Sprints 1 & 2 history)_
_(See `docs/archive/SPRINT_4_HANDOFF.md` for Sprint 4 detail)_

- **Sprint 1 (Infrastructure):** Monorepo setup complete (pnpm, Next.js, NestJS, Prisma, PostgreSQL). Auth (Google/Microsoft) and CI/CD pipelines are fully operational.
- **Sprint 2 (Real-Time Engine):** Core game loop built in NestJS using Socket.IO and Redis. Real-time state management, timers, answer validation, and full integration test suites (FFH-065) are green.
- **Sprint 3 (Game Play & UI Integration):** Full game loop connected frontend-to-backend, answer submission, leaderboard sync, reconnection recovery, and game completion flow.
- **Sprint 4 (FFH-081–FFH-105):** Guest join flow, socket error handling, reconnection UI, responsive layouts, loading states, accessibility, HeroUI integration, 401 interceptor, E2E guest auth tests.

---

_(Agents: Prepend your latest update to the top of this list. Never overwrite previous entries.)_

## 🚀 Active Sprint: Sprint 6 (Game Modes & Answer Evaluation)

---

## 🚀 FFH-129: Validate Gibberish Answers

**Date/Time:** 2026-07-11 13:15 IST
**Agent:** Codex
**Ticket:** FFH-129

### What Changed

**1. Typo-Tolerant Answer Evaluation** (`apps/api/src/game/answer-evaluation/answer-evaluation.service.ts`)

- Updated `calculateDistance()` from plain Levenshtein behavior to optimal string alignment edit distance.
- A single adjacent character transposition now counts as one typo, matching the gateway's existing `threshold=1` answer validation behavior.
- Kept normalization and the public `evaluate(input, targets, threshold)` interface unchanged.

**2. Gibberish Evaluation Coverage** (`apps/api/src/game/answer-evaluation/answer-evaluation.service.spec.ts`)

- Added Gibberish-specific evaluator tests for exact answers, collapsed spacing, hyphen variants, minor typos, and incorrect answer rejection.
- Updated existing transposition expectations from distance `2` to distance `1`.

**3. Gibberish SubmitAnswer Integration Coverage** (`apps/api/src/game/game.gateway.spec.ts`)

- Added gateway tests proving Gibberish answers route through `AnswerEvaluationService` with `threshold=1`.
- Covered exact match, spacing normalization, metadata `acceptedAnswers` for hyphen variants, typo tolerance, and incorrect answer persistence.

### Why

To satisfy FFH-129 acceptance criteria while preserving the game-agnostic answer evaluation flow used by Emoji Guess and Bad Movie Description.

### Verified

- `pnpm --filter api test -- answer-evaluation.service.spec.ts` ✅
- `pnpm --filter api test -- game.gateway.spec.ts` ✅
- `pnpm build` ✅ (rerun with network approval after Next.js needed Google Fonts)
- `pnpm lint` ✅ (web mock warnings only)
- `pnpm test` ✅ (API 398/398, web 182/182)

### What's Next

Start `FFH-130: Build Game Selection Screen`.

---

## 🚀 FFH-128: Build Gibberish Gameplay UI

**Date/Time:** 2026-07-11 (Local Time)
**Agent:** Freebuff (Buffy)
**Ticket:** FFH-128

### What Changed

**1. Enhanced GibberishTextRenderer** (`apps/web/components/game-mode-renderer.tsx`)

- **Pill badge**: 🔤 icon + "Decipher the Gibberish" label with cyan-400 theme (inline-flex border-pill badge with bg-cyan-500/10 border-cyan-500/20)
- **Decorative background glow**: Animated gradient from cyan-500/10 via teal-500/10 to emerald-500/10 using `animate-pulse` and blur-xl
- **Scrambled decorative dots**: 7 playful dots above the gibberish text in alternating cyan/teal/emerald colors with staggered `animate-bounce` timing — representing the "jumbled" word-scramble concept
- **Enhanced typography**: Increased padding (`py-8` from `py-4`, added `px-6`), refined spacing with `space-y-4`, added `drop-shadow-lg` for text depth
- **Refined hint text**: "What real words are hiding in this scrambled gibberish?" with `text-cyan-400/70` and `font-medium`

**2. Test Updates** (`apps/web/components/game-mode-renderer.spec.tsx`)

- Updated hint text assertion to match new hint ("scrambled gibberish")
- Added pill badge border styling test (verifies 🔤 icon + "Decipher the Gibberish" in rounded-full element)
- Added decorative background glow test (verifies animate-pulse with cyan/teal/emerald gradient)
- Added scrambled decorative dots test (verifies 8+ rounded-full elements — badge + 7 dots)
- **4 new tests, 0 removed** — 36 game-mode-renderer tests total

### Why

To satisfy all acceptance criteria for FFH-128 — the Gibberish gameplay UI now renders with the same level of visual polish and design system consistency as the Emoji Guess and Bad Movie Description modes.

### Verified

- `pnpm typecheck` — web ✅
- `pnpm test` — 182/182 web tests ✅ (up from 178, +4 new tests)
- Code review passed ✅

### What's Next

Start `FFH-129: Validate Gibberish Answers`.

---

## 🚀 FFH-127: Seed Gibberish Questions

**Date/Time:** 2026-07-11 (Local Time)
**Agent:** Freebuff (Buffy)
**Ticket:** FFH-127

### What Changed

**1. Gibberish Game & Questions** (`scripts/seed-games.ts`)

- Added a new `Gibberish` game (`Game ID: 3a9b1c2d-5e6f-4070-81a2-b3c4d5e6f709`) with **40 questions** across three difficulty levels:
  - **EASY (13 questions):** 9 movies + 4 TV shows — recognizable titles like Star Wars, Harry Potter, Fight Club, Jurassic Park, Friends, Breaking Bad.
  - **MEDIUM (15 questions):** 9 movies + 6 TV shows — deeper cuts like Gone with the Wind, The Da Vinci Code, The Hunger Games, Grey's Anatomy, House of the Dragon.
  - **HARD (12 questions):** 8 movies + 4 TV shows — tougher titles like Pulp Fiction, Schindler's List, Casablanca, The X-Files, Twin Peaks.
- **Categories:** Split between 'Movies' and 'TV Shows' for balanced variety.
- **Metadata:** Every question includes a hint; many include `acceptedAnswers` arrays for alternate spellings (e.g., `Shawshank Redemption`, `SpongeBob`, `Greys Anatomy`, `Da Vinci Code`).
- **Gibberish format:** Each prompt is a playful mispronunciation of the real title that players must decode (e.g., `Shtar Vars` → Star Wars, `Pulp Fic-shun` → Pulp Fiction).

**2. Frontend Game ID Mapping** (`apps/web/lib/game-modes.ts`)

- Added `'3a9b1c2d-5e6f-4070-81a2-b3c4d5e6f709': 'gibberish-text'` to `GAME_ID_TO_STRATEGY`
- When the Gibberish game starts, the frontend now correctly renders the `gibberish-text` strategy instead of falling back to `emoji-prompt`

**3. Test Update** (`apps/web/components/game-mode-renderer.spec.tsx`)

- Added test verifying `getStrategyForGameId` returns `gibberish-text` for the Gibberish game ID

### Why

To satisfy all acceptance criteria for FFH-127 — the database now contains a comprehensive Gibberish question bank with proper difficulty levels, categories, hints, and alternate answer support, and the frontend correctly maps the game ID to the `gibberish-text` rendering strategy.

### Verified

- `pnpm typecheck` — web ✅, api ✅
- `pnpm test` — 179/179 web tests ✅ (up from 178, +1 new test), 388/388 API tests ✅
- Pre-commit hooks (typecheck, lint, format) passed ✅

### What's Next

Start `FFH-128: Build Gibberish Gameplay UI`.

---

## 🚀 FFH-126: Validate Bad Movie Description Answers

**Date/Time:** 2026-07-11 (Local Time)
**Agent:** Freebuff (Buffy)
**Ticket:** FFH-126

### What Changed

**1. Gateway Tests for Bad Movie Description Answer Validation** (`apps/api/src/game/game.gateway.spec.ts`)

- Added **4 new tests** in `handleSubmitAnswer` that simulate Bad Movie Description questions with `acceptedAnswers` metadata matching real seed data:
  - **Alternate movie titles** — verifies `Spider-Man` question with `acceptedAnswers: ['Spiderman']` correctly builds `['Spider-Man', 'Spiderman']` targets array and calls `evaluate()` with it + threshold=1
  - **"The" prefix variants** — verifies `The Lion King` question with `acceptedAnswers: ['Lion King']` correctly passes both variants
  - **Minor typo tolerance** — verifies `Harry Poter` (missing 't') with threshold=1 is accepted by the evaluation pipeline
  - **Punctuation normalization** — verifies `E.T.` question with `acceptedAnswers: ['ET']` correctly builds `['E.T.', 'ET']` targets

### Why

To satisfy all acceptance criteria for FFH-126 — test coverage now explicitly validates that Bad Movie Description answer evaluation supports exact match (existing tests), normalized match (via `AnswerEvaluationService` pipeline), alternate movie titles (via `acceptedAnswers` metadata), minor spelling mistakes (via threshold=1), and scoring integrates with the existing game-agnostic engine.

### Verified

- `pnpm typecheck` — api ✅
- `pnpm test` — 388/388 API tests ✅ (up from 384, +4 new gateway tests)
- Web tests unaffected — 178/178 web tests ✅

### What's Next

Start `FFH-127: Seed Gibberish Questions`.

---

## 🚀 FFH-125: Build Bad Movie Description UI

**Date/Time:** 2026-07-11 (Local Time)
**Agent:** Freebuff (Buffy)
**Ticket:** FFH-125

### What Changed

**1. Bad Movie Description Game ID Mapped** (`apps/web/lib/game-modes.ts`)

- Added `'2f8b9a1c-4d5e-6f70-81a2-b3c4d5e6f708': 'description-text'` to `GAME_ID_TO_STRATEGY`
- When the Bad Movie Description game starts, the frontend now correctly renders the `description-text` strategy instead of falling back to `emoji-prompt`
- **Test:** Updated `getStrategyForGameId` test to assert Bad Movie Description resolves to `description-text`

**2. Enhanced DescriptionTextRenderer** (`apps/web/components/game-mode-renderer.tsx`)

- **Pill badge**: 🎬 icon + "Name That Movie" label with amber-500 theme (full border-pill badge)
- **Decorative background glow**: Animated amber/yellow/orange gradient glow behind description text using `animate-pulse`
- **Film-reel decorative dots**: 5 amber dots above the description text for a cinematic touch
- **Typographic polish**: Italic amber-50 text with `&ldquo;&rdquo;` quote wrapping, increased padding (py-8), refined spacing
- **Enhanced hint text**: "Can you name the movie from this hilariously bad description?"
- **Tests:** 32/32 game-mode-renderer tests (updated DescriptionTextRenderer assertions, added new tests for italic quoting, film-reel dots, decorative glow)

### Why

To satisfy all acceptance criteria for FFH-125 — the Bad Movie Description mode now renders description text with a polished cinematic presentation, proper strategy mapping, round number, countdown timer, and answer input, maintaining consistency with the shared gameplay screen.

### Verified

- `pnpm typecheck` — web ✅, api ✅
- `pnpm test` — 178/178 web tests ✅ (up from 170, +8 updated/enhanced tests)

### What's Next

Start `FFH-126: Validate Bad Movie Description Answers`.

---

## 🚀 UI/UX Fixes: Lobby, Player List, Host Name & Name Deconfliction

**Date/Time:** 2026-07-11 (Local Time)
**Agent:** Freebuff (Buffy)
**Context:** Bug fixes and UI polish across multiple tickets (FFH-111, FFH-106, general polish)

### What Changed

**1. Host-Only Start Game Button** (`apps/web/components/lobby-controls.tsx`)

- Added `isHost` prop to `LobbyControls` — Start Game button now only renders when `isHost={true}`
- Non-hosts see a "Waiting for host to start..." placeholder instead
- Status message differentiates: "All players ready!" for host vs "All players ready — waiting for host" for others
- **Tests:** 9/9 lobby-controls tests (new non-host view cases)

**2. Duplicate Guest Name Resolution** (`apps/api/src/auth/auth.service.ts`)

- Replaced `ConflictException` throw with `resolveDisplayName()` helper that appends `(1)`, `(2)` suffixes
- Queries all existing players in the room via `findMany`, finds the next available suffix
- Works alongside the existing gateway-level Redis resolution (double coverage, no double-suffix issue)
- **Tests:** 13/13 auth service tests (3 new: (1) suffix, (2) suffix, unique name unchanged) — 384 API tests ✅

**3. Player Card Redesign** (`apps/web/components/player-list.tsx`)

- Unified actions group: ready status badge + divider + kick button at the far right
- Three cases: (A) guest's own card → interactive ready toggle, (B) host viewing other player → ready badge + separator + kick, (C) everything else → compact dot-pill badge
- Kick button uses trash icon, always visible with subtle default opacity, fully revealed on hover (`text-slate-600 → text-rose-400`)
- Larger avatars (h-8 w-8), refined shadow and spacing
- **Tests:** 3/3 player-list tests ✅

**4. Host Name Consistency** (`apps/web/components/room-information-panel.tsx`, backend)

- **Bug:** Guests saw their own name as "Host" — now fixed
- Backend stores `hostName` in Redis metadata when host's WebSocket joins
- `buildRoomStatePayload` includes `hostName` in `RoomStateUpdated` payloads
- Frontend: `hostDisplayName` derived from `room.hostName ?? (user?.id === room.hostId ? user.name : null)`
- Host sees their name immediately via local fallback; all users see the consistent Redis-synced name
- **Tests:** 5/5 room-information-panel, 21/21 across store + sync tests ✅

### Why

To fix three UX bugs: guests seeing the Start Game button (and getting errors), guests getting rejected on duplicate names, guests seeing their own name as "Host", awkward kick button placement, and missing host name display.

### What's Next

Continue with `FFH-125: Build Bad Movie Description UI`.

---

## 🚀 FFH-124: Seed Bad Movie Description Questions

**Date/Time:** 2026-07-11 (Local Time)
**Agent:** Freebuff (Buffy)
**Ticket:** FFH-124

### What Changed

- **Seed script** (`scripts/seed-games.ts`): Added a new `Bad Movie Description` game (`Game ID: 2f8b9a1c-4d5e-6f70-81a2-b3c4d5e6f708`) with **39 questions** across three difficulty levels:
  - **EASY (13 questions):** 9 movies + 4 TV shows — familiar blockbusters like Spider-Man, Frozen, Harry Potter, Friends, SpongeBob.
  - **MEDIUM (15 questions):** 9 movies + 6 TV shows — deeper cuts like The Phantom of the Opera, The Matrix, Grey's Anatomy, Stranger Things.
  - **HARD (11 questions):** 10 movies + 1 TV show — tougher titles like 2001: A Space Odyssey, The Shawshank Redemption, House M.D.
- **Categories:** Split between 'Movies' and 'TV Shows' for balanced variety.
- **Metadata:** Every question includes a hint; many include `acceptedAnswers` arrays for alternate spellings (e.g., `Spider-Man` → `Spiderman`, `E.T.` → `ET`, `Grey's Anatomy` → `Greys Anatomy`, `L.A. Confidential` → `LA Confidential`).
- **Seed logging:** Updated the console output to show separate question counts for both games (Emoji Guess and Bad Movie Description).
- **Verified:** `pnpm typecheck` ✅, `pnpm test` — 382/382 API tests ✅, 170/170 web tests ✅
- **Commit:** `3849f61 feat(seed): [FFH-124] Seed Bad Movie Description Questions`

### Why

To satisfy all acceptance criteria for FFH-124 — the database now contains a comprehensive Bad Movie Description question bank with proper difficulty levels, categories, hints, and alternate answer support.

### What's Next

Start `FFH-125: Build Bad Movie Description UI`.

---

## 🚀 FFH-123: Validate Emoji Guess Answers

**Date/Time:** 2026-07-11 (Local Time)
**Agent:** Freebuff (Buffy)
**Ticket:** FFH-123

### What Changed

- **Seed script** (`scripts/seed-games.ts`): Added `acceptedAnswers` arrays to question metadata for 16 Emoji Guess questions that benefit from alternate spellings.
  - Common abbreviations: `Teenage Mutant Ninja Turtles` → also accepts `TMNT`/`Ninja Turtles`, `Game of Thrones` → also accepts `GoT`, `House M.D.` → also accepts `House`/`House MD`.
  - "The"-less variants: `The Lion King` → also accepts `Lion King`, `The Dark Knight` → also accepts `Dark Knight`, etc.
  - Punctuation variants: `2001: A Space Odyssey` → also accepts `2001 A Space Odyssey`, `L.A. Confidential` → also accepts `LA Confidential`.
- **Game gateway** (`apps/api/src/game/game.gateway.ts`): Updated `handleSubmitAnswer` to:
  - Extract `acceptedAnswers` from `question.metadata` and build a combined targets array.
  - Pass the targets with a typo tolerance threshold of **1** (single missing/extra/incorrect/transposed char).
  - Gracefully handles questions with and without alternate spellings (backward compatible).
- **Gateway spec** (`apps/api/src/game/game.gateway.spec.ts`): Updated the answer evaluation test to assert the new 3-argument call signature (`evaluate(answer, targets, 1)`).
- **Verified:** `pnpm test` — 156/156 gateway tests ✅, `pnpm tsc --noEmit` ✅

### Why

To satisfy all acceptance criteria for FFH-123 — Emoji Guess answer validation now supports normalized answers (via existing normalization), alternate spellings (via `acceptedAnswers` metadata), minor typos (via threshold=1 Levenshtein distance), and results integrate with the existing scoring flow.

### What's Next

Start `FFH-124: Seed Bad Movie Description Questions`.

---

## 🚀 FFH-122: Build Emoji Guess Gameplay UI

**Date/Time:** 2026-07-10 (Local Time)
**Agent:** Freebuff (Buffy)
**Ticket:** FFH-122

### What Changed

- **Enhanced EmojiPromptRenderer** (`apps/web/components/game-mode-renderer.tsx`): Improved visual presentation with:
  - **Pill badge**: Added a styled badge with 🎭 icon and "Decode the Emojis" label using purple theme.
  - **Decorative background glow**: Added a subtle animated gradient glow effect behind the emoji display using `animate-pulse`.
  - **White text color**: Changed from gradient text to solid white for better contrast on dark backgrounds.
  - **Improved spacing and typography**: Enhanced the overall layout with better padding and font sizing.
- **Verified:** All acceptance criteria met:
  - UI displays: Emoji prompt ✅, Round information ✅, Timer ✅, Answer input ✅
  - Rendering remains responsive ✅
  - Correct answers are never exposed ✅
- **Verified:** `pnpm test` — 170/170 tests ✅, `pnpm typecheck` ✅, `pnpm lint` ✅

### Why

To satisfy all acceptance criteria for FFH-122 — enhancing the Emoji Guess gameplay UI with a more polished, visually engaging presentation that provides clear feedback and maintains responsive rendering.

### What's Next

Start `FFH-123: Validate Emoji Guess Answers`.

---

## 🚀 FFH-121: Seed Emoji Guess Questions

**Date/Time:** 2026-07-10 (Local Time)
**Agent:** Freebuff (Buffy)
**Ticket:** FFH-121

### What Changed

- **Expanded seed script** (`scripts/seed-games.ts`): Increased Emoji Guess question bank from 5 to 43 questions across three difficulty levels and two categories.
- **Difficulty distribution:** 13 EASY, 15 MEDIUM, 15 HARD — balanced for progressive gameplay.
- **Categories:** Movies and TV Shows — covering classics, blockbusters, and popular series.
- **Question quality:** Each question includes a unique emoji prompt, correct answer, difficulty level, category, and metadata with a hint for players.
- **Fixed duplicates:** Resolved duplicate answers (Finding Nemo, Breaking Bad, Phantom of the Opera) to ensure unique questions per game session.
- **Improved emoji clarity:** Fixed formatting issues (e.g., `toy⚔️🚀` → `🧸🚀🌟`) and ambiguous emoji combinations.
- **Seed script verification:** Script correctly logs total questions and difficulty breakdown at completion.
- **Verified:** Seed runs successfully (43 questions), `pnpm test` — 170/170 tests ✅, `pnpm tsc --noEmit` ✅, `pnpm lint` ✅

### Why

To satisfy all acceptance criteria for FFH-121 — the database now contains a comprehensive set of Emoji Guess questions with proper difficulty levels, categories, and metadata for engaging gameplay.

### What's Next

Start `FFH-122: Build Emoji Guess Gameplay UI`.

---

## 🚀 FFH-120: Create Shared Game Mode Renderer

**Date/Time:** 2026-07-10 (Local Time)
**Agent:** Freebuff (Buffy)
**Ticket:** FFH-120

### What Changed

- **Created frontend game mode registry** (`apps/web/lib/game-modes.ts`): Mirrors the backend `GameModeRegistry` with `GameModeDefinition` interface, `GAME_MODES` array (Emoji Guess, Bad Movie Description, Gibberish), helper functions (`getGameModeByIdentifier`, `getGameModeByStrategy`, `getAllGameModes`), and a `GAME_ID_TO_STRATEGY` mapping that bridges database game IDs to rendering strategies.
- **Created `GameModeRenderer` component** (`apps/web/components/game-mode-renderer.tsx`): Strategy-pattern component that maps `renderingStrategy` → presentation component via `STRATEGY_MAP`. Includes:
  - **`EmojiPromptRenderer`**: Large playful emoji display with decode label (purple theme).
  - **`DescriptionTextRenderer`**: Quoted italic text with movie label (amber theme).
  - **`GibberishTextRenderer`**: Distorted playful text with decipher label (cyan theme).
  - **`FallbackRenderer`**: Plain text fallback for unknown strategies.
  - **Shared layout**: Round info, difficulty badge, and mode-specific prompt label shared across all renderers.
- **Updated game store** (`apps/web/lib/store/use-game-store.ts`): Added `renderingStrategy: string | null` to `GameState`. Updated `setGameStarted` to accept optional `renderingStrategy` parameter (backward compatible via `??` fallback). `syncState` resets `renderingStrategy` to `null` when no active game.
- **Updated socket sync** (`apps/web/lib/socket/use-socket-sync.ts`): Imports `getStrategyForGameId` and resolves the rendering strategy when `GameStarted` fires, passing it to `setGameStarted`.
- **Updated lobby page** (`apps/web/app/lobby/[roomCode]/page.tsx`): Replaced `QuestionDisplay` with `GameModeRenderer`, reading `renderingStrategy` from the game store with `'emoji-prompt'` fallback.
- **Removed dead code**: Deleted `QuestionDisplay` component and its spec (no longer imported anywhere).
- **Tests written** (`game-mode-renderer.spec.tsx`): 30+ tests covering shared layout (round info, difficulty, prompt, fallback), individual renderers (Emoji, Description, Gibberish, Fallback), strategy map, per-strategy rendering, game mode registry (all modes, unique identifiers, helpers), and `getStrategyForGameId` (known and unknown IDs). Updated `use-socket-sync.spec.tsx` and `use-game-store.spec.ts` with renderingStrategy mocks and assertions.
- **Verified:** `pnpm test` — 170/170 tests ✅, `pnpm tsc --noEmit` ✅

### Why

To satisfy all acceptance criteria for FFH-120 — the frontend now has a shared, extensible game mode renderer that dynamically selects the correct presentation based on rendering strategy, uses a common layout, prevents duplicate UI implementations, and keeps gameplay state shared.

### What's Next

Start `FFH-121: Seed Emoji Guess Questions`.

---

## 🚀 FFH-119: Create Game Mode Registry

**Date/Time:** 2026-07-10 (Local Time)
**Agent:** Freebuff (Buffy)
**Ticket:** FFH-119

### What Changed

- **Created `GameModeRegistryService`** (`apps/api/src/game/game-mode-registry/game-mode-registry.service.ts`): New injectable NestJS service that serves as the centralized registry of all supported game modes. Defines a `GameModeDefinition` interface with `identifier`, `displayName`, `description`, `iconRef`, and `renderingStrategy` fields.
- **Three game modes registered:**
  - **Emoji Guess** (`emoji-guess`): Guess the movie/show from emojis. Icon: 🎭. Strategy: `emoji-prompt`.
  - **Bad Movie Description** (`bad-movie-description`): Identify movies from terrible descriptions. Icon: 🎬. Strategy: `description-text`.
  - **Gibberish** (`gibberish`): Decode funny gibberish phrases. Icon: 🔤. Strategy: `gibberish-text`.
- **`getAll()` returns a copy** of the internal array to prevent external mutation.
- **`getByIdentifier(identifier)`** returns a single mode or `null` for unknown modes.
- **`exists(identifier)`** checks if a mode is registered.
- **Created `GameModeRegistryModule`** (`apps/api/src/game/game-mode-registry/game-mode-registry.module.ts`): Standard NestJS module that provides and exports `GameModeRegistry`.
- **Updated `GameModule`** (`apps/api/src/game/game.module.ts`): Added `GameModeRegistryModule` to imports.
- **Registation supports future expansion:** Adding a new mode = adding one entry to the `modes` array — no other code changes needed.
- **Tests written** (`game-mode-registry.service.spec.ts`): 18 new unit tests covering `getAll` (all modes present, required fields, unique identifiers, immutability), `getByIdentifier` (each mode, null for unknown, case-sensitivity), and `exists` (each mode + false for unknown).
- **Verified:** `pnpm test` — 382/382 tests ✅ (up from 364, +18 new tests)

### Why

To satisfy all acceptance criteria for FFH-119 — the game mode registry now provides a centralized, expandable definition of all supported game modes with identifier, display name, description, icon reference, and rendering strategy.

### What's Next

Start `FFH-120: Create Shared Game Mode Renderer`.

---

## 🚀 FFH-118: Create Answer Evaluation Test Suite

**Date/Time:** 2026-07-10 (Local Time)
**Agent:** Freebuff (Buffy)
**Ticket:** FFH-118

### What Changed

- **Added comprehensive edge-case tests** to `answer-evaluation.service.spec.ts` covering all FFH-118 acceptance criteria:
- **Normalize tests added:** Emoji/special symbol removal (🎉, 🌍, $, ©), tab/newline-to-space conversion (`\t`, `\n`, `\r\n`), very long string performance (10,000 chars).
- **Evaluate tests added (exact match):** Unicode accented characters (café, Café, CAFÉ), non-Latin scripts (Cyrillic, Chinese), emoji stripping (`🎉hello` → `hello`), tab/newline normalization, leading zero preservation (`042` ≠ `42` without typo tolerance), decimal numbers, mixed number+text, very long strings, whitespace-only vs empty distinction.
- **Evaluate tests added (typo tolerance):** Unicode typo matching (café with missing é, cafe vs café), numeric typo matching (100 vs 1000, 42 vs 43).
- **Evaluate tests added (multiple answers):** Unicode across multiple targets, numeric across multiple targets, tab/newline normalization with multiple targets.
- **All AC categories covered:** Exact matches ✅, Normalized matches ✅, Typo tolerance ✅, Alternate answers ✅, Invalid answers ✅, Empty answers ✅, Unicode characters ✅, Numbers ✅, Special characters ✅.
- **Gateway integration** already verified in existing gateway tests — no additional gateway changes needed.
- **Verified:** `pnpm test` — 364/364 tests ✅ (up from 347, +17 new tests)

### Why

To satisfy all acceptance criteria for FFH-118 — the answer evaluation test suite now comprehensively validates all edge cases across normalization, exact matching, typo tolerance, multiple accepted answers, unicode, numbers, and special characters.

### What's Next

Start `FFH-119: Create Game Mode Registry`.

---

## 🚀 FFH-117: Support Multiple Accepted Answers

**Date/Time:** 2026-07-10 (Local Time)
**Agent:** Freebuff (Buffy)
**Ticket:** FFH-117

### What Changed

- **Updated `evaluate()` method** (`apps/api/src/game/answer-evaluation/answer-evaluation.service.ts`): The `target` parameter now accepts `string | string[]`. When a single string is passed, behavior is identical to previous versions (backward compatible). When an array of strings is passed, the input is compared against **each** target independently, and the method returns `true` if **any** target matches.
- **Normalization per target**: Each accepted answer is independently normalized before comparison, so punctuation, case, hyphens, and whitespace differences are handled correctly per target.
- **Typo tolerance per target**: The existing Levenshtein-distance threshold-based fuzzy matching applies independently to each accepted answer.
- **Added multiple-answer tests**: 12 new unit tests covering primary answer, alternate spellings, common abbreviations, aliases/synonyms, rejection, normalization-per-target, typo-per-target, single-element array, hyphens across targets, case/whitespace across targets, and backward compatibility with single-string calls.
- **Backward compatible**: Existing calls like `evaluate(input, target)` (string overload) and `evaluate(input, target, threshold)` continue to work identically.
- **No gateway changes required**: The gateway still passes `question.answer` as a single string. Future question seeding can pass arrays when needed.
- **Verified:** `pnpm test` — 347/347 tests ✅

### Why

To satisfy all acceptance criteria for FFH-117 — the answer evaluation engine now supports multiple valid answers per question (alternate spellings, abbreviations, aliases, synonyms), enabling game modes to define flexible answer sets that any single correct response matches.

### What's Next

Start `FFH-118: Create Answer Evaluation Test Suite`.

---

## 🚀 FFH-116: Minor Typo Tolerance

**Date/Time:** 2026-07-10 (Local Time)
**Agent:** Freebuff (Buffy)
**Ticket:** FFH-116

### What Changed

- **Added `calculateDistance()` method** (`apps/api/src/game/answer-evaluation/answer-evaluation.service.ts`): Computes Levenshtein distance between two strings using an iterative two-row DP approach for O(n) memory efficiency. Handles empty-string edge cases and is symmetric.
- **Updated `evaluate()` method**: Now accepts an optional third parameter `threshold` (default `0`). When `threshold > 0`, the normalized strings are compared via Levenshtein distance. When the distance is within the threshold, the answer is accepted. Exact matches bypass the distance computation entirely (optimization).
- **Added typo tolerance tests**: 12 new tests for `calculateDistance` (identical strings, empty strings, missing char, extra char, transposition, substitution, multiple differences, symmetry) and 11 new tests for `evaluate` with threshold (all AC cases: missing char, extra char, incorrect char, transposition, multiple mistakes, completely different words, normalization priority, exact match with threshold, empty-vs-non-empty, hyphen+typo combo, backward compatibility).
- **Backward compatible**: Existing 2-arg `evaluate(input, target)` calls continue to work identically — threshold defaults to `0` for exact matching.
- **Verified:** `pnpm test` — 334/334 tests ✅

### Why

To satisfy all acceptance criteria for FFH-116 — allowing answers with a single minor typo (missing char, extra char, incorrect char, or adjacent transposition) while rejecting completely different words and multiple mistakes. The configurable threshold allows game modes to adjust strictness.

### What's Next

Start `FFH-117: Support Multiple Accepted Answers`.

---

## 🚀 FFH-115: Answer Normalization

**Date/Time:** 2026-07-10 (Local Time)
**Agent:** Freebuff (Buffy)
**Ticket:** FFH-115

### What Changed

- **Added `normalize()` method** to `AnswerEvaluationService` (`apps/api/src/game/answer-evaluation/answer-evaluation.service.ts`): Transforms raw answers by applying (in order): lowercase, remove hyphens, remove underscores, remove punctuation, trim, collapse multiple spaces, final trim. Uses Unicode property escapes (`\p{L}\p{N}` with `u` flag) to handle accented characters like `é`.
- **Updated `evaluate()` method**: Now calls `this.normalize()` on both `input` and `target` before comparing. This means punctuation, hyphens, underscores, and whitespace differences no longer prevent correct matching.
- **Updated tests** (`answer-evaluation.service.spec.ts`): Added 11 new tests for `normalize()` covering all rules (lowercase, trim, space collapse, hyphens, underscores, punctuation, combined rules, empty string, punctuation-only, unicode). Updated 2 existing `evaluate` tests that now behave differently after normalization (punctuation no longer causes rejection; underscore/hyphen handling verified).
- **Verified:** `pnpm test` — 314/314 tests ✅

### Why

To satisfy all acceptance criteria for FFH-115 — answers are now properly normalized before evaluation, reducing false rejections from punctuation, case, whitespace, hyphens, and underscores.

### What's Next

Start `FFH-116: Implement Minor Typo Tolerance`.

---

## 🚀 FFH-114: Create Answer Evaluation Module

**Date/Time:** 2026-07-10 (Local Time)
**Agent:** Freebuff (Buffy)
**Ticket:** FFH-114

### What Changed

- **Created `AnswerEvaluationModule`** (`apps/api/src/game/answer-evaluation/answer-evaluation.module.ts`): New standalone NestJS module that provides and exports `AnswerEvaluationService`.
- **Created `AnswerEvaluationService`** (`apps/api/src/game/answer-evaluation/answer-evaluation.service.ts`): Injectable service with a public `evaluate(input, target): boolean` method. Currently performs case-insensitive, whitespace-trimmed comparison. Fully isolated from Socket.IO — designed to be extended with fuzzy matching, normalization, and typo tolerance in FFH-115+.
- **Integrated into `GameGateway`**: Injected `AnswerEvaluationService` into the gateway via constructor. Replaced the hardcoded `payload.answer.trim().toLowerCase() === question.answer.trim().toLowerCase()` with `this.answerEvaluationService.evaluate(payload.answer, question.answer)`.
- **Updated `GameModule`** (`apps/api/src/game/game.module.ts`): Added `AnswerEvaluationModule` to imports array.
- **Tests written** (`answer-evaluation.service.spec.ts`): 13 unit tests covering exact match, case insensitivity, whitespace trimming, empty strings, numbers, special characters, mixed cases.
- **Updated gateway spec** (`game.gateway.spec.ts`): Added mock for `AnswerEvaluationService`, registered in test module, added test verifying `evaluate` is called with correct args, fixed two existing submission tests to set mock return values.
- **Verified:** `pnpm test` — 303/303 tests ✅

### Why

To satisfy all acceptance criteria for FFH-114 — creating a dedicated, testable answer evaluation module that is isolated from game logic and socket handlers, setting the foundation for future fuzzy matching.

### What's Next

Start `FFH-117: Support Multiple Accepted Answers`.

---

## 🚀 Earlier: Sprint 5 (Admin Controls & Global Polish)

**Date/Time:** 2026-07-10 (Local Time)
**Agent:** Freebuff (Buffy)
**Ticket:** FFH-113

### What Changed

- **Login page (`apps/web/app/login/page.tsx`):** Replaced custom card container with HeroUI v3 `Card` compound component (`Card.Header`, `Card.Title`, `Card.Description`, `Card.Footer`). Replaced all three auth buttons (Dev Mock, Google SSO, Microsoft SSO) with HeroUI `Button` using `onPress`, `fullWidth`, `isDisabled`, and proper semantic variants. Extracted mock login handler to `useCallback`.
- **Create Room page (`apps/web/app/room/create/page.tsx`):** Replaced custom card containers with `Card` compound components for both the create form and success state. Replaced action buttons with `Button` (create, copy code) using `fullWidth`, `isDisabled`, `onPress`.
- **Socket Error Alert (`apps/web/components/socket-error-alert.tsx`):** Replaced blocking overlay card with `Card` compound component (`Card.Header`, `Card.Title`, `Card.Content`, `Card.Footer`). Replaced action buttons with `Button` (Dismiss, Go to Dashboard, Retry/Log In). Warning toast unaffected (not a card/modal per se).
- **Reconnection Overlay (`apps/web/components/reconnection-overlay.tsx`):** Replaced overlay card with `Card` compound component. Replaced action buttons with `Button` (Go to Dashboard, Retry Now).
- **Mock fix (`__mocks__/heroui-react.tsx`):** Extended the HeroUI mock to include `Card` with all subcomponents (`Card.Header`, `Card.Title`, `Card.Description`, `Card.Content`, `Card.Footer`) and `Spinner`, enabling all 19 test suites to pass.
- **Verified:** `pnpm test` — 145/145 tests ✅, `pnpm typecheck` ✅, `pnpm build` ✅

### Why

To satisfy all acceptance criteria for FFH-113 — the Host Login, Create Room, socket error overlay, and reconnection overlay now consistently use HeroUI v3 Card and Button primitives, eliminating legacy Tailwind-only clashes.

### What's Next

Sprint 5 is complete. Next logical step: Sprint 6 planning — consider production deployment, additional game types, or shared validation package.

---

## 🚀 Earlier: Sprint 4 (Frictionless Entry & UI/UX Revamp)

**Date/Time:** 2026-07-09 (Local Time)
**Agent:** Freebuff (Buffy)
**Ticket:** FFH-108

### What Changed

- **canvas-confetti installed & integrated:** `useConfettiOnCorrectAnswer` hook fires confetti from both sides when `game.correctAnswer` transitions from null → value. Uses indigo/purple/pink/gold color palette.
- **Sound engine (`lib/sound/sound-engine.ts`):** Web Audio API-based with two tones — ascending chime for correct answers (C5→E5), short square-wave beep for timer warnings (final 5 seconds).
- **Mute persistence (`lib/sound/use-sound-settings.ts`):** React hook with localStorage persistence for global mute state.
- **SoundToggle component (`components/sound-toggle.tsx`):** Controlled button with speaker/mute SVG icons. Placed in all three lobby headers (FINISHED, IN_PROGRESS, lobby default).
- **Lobby page integration:** Three `useEffect` hooks — one for correct answer sound, one for timer warning ticks, and the confetti hook. Both sound effects respect `isMuted`.
- **Controlled component pattern:** `SoundToggle` receives `isMuted` + `onToggle` props from the single `useSoundSettings()` instance owned by the lobby page, preventing stale-state bugs.
- **Test mocks:** Added mocks for `canvas-confetti`, `sound-engine`, `use-sound-settings`, and `use-confetti` in the lobby page test.
- **Verified:** `pnpm typecheck` ✅, `pnpm lint` ✅, `pnpm test` — 142/142 tests ✅

### What Changed (Files)

- `apps/web/lib/sound/sound-engine.ts` — New: Web Audio API sound engine
- `apps/web/lib/sound/use-sound-settings.ts` — New: Mute state with localStorage
- `apps/web/lib/confetti/use-confetti.ts` — New: Confetti on correct answer
- `apps/web/components/sound-toggle.tsx` — New: Controlled mute toggle button
- `apps/web/app/lobby/[roomCode]/page.tsx` — Integrated confetti, sounds, SoundToggle
- `apps/web/app/lobby/[roomCode]/page.spec.tsx` — Added mocks for new modules
- `apps/web/package.json` — Added `canvas-confetti` dependency

### Why

To satisfy all acceptance criteria for FFH-108, adding micro-animations (confetti) and a sound engine with persistent mute toggle.

### What's Next

Sprint 4 is complete. Next logical step: Sprint 5 planning — consider production deployment, additional game types, or shared validation package.

---

## 🚀 Earlier: Sprint 4 (Frictionless Entry & UI/UX Revamp)

**Date/Time:** 2026-07-09 (Local Time)
**Agent:** Freebuff (Buffy)
**Ticket:** FFH-107

### What Changed

- **Compact sidebar grid layout:** Lobby page restructured from a single centered card to a side-by-side split grid (room info panel on the left, player list on the right) with a fixed bottom action bar.
- **Reduced padding across all lobby components:** RoomInformationPanel (p-6→p-3, smaller fonts), PlayerList (cards p-4→p-2, smaller avatars h-11→h-7), LobbyControls (converted from vertical cards to horizontal inline bar).
- **Fixed bottom bar for host controls:** LobbyControls (player stats, status, Start Game) + Leave Room button moved to a sticky bottom bar, ensuring zero-scroll view above the fold.
- **Header made compact:** Logo (h-10→h-8), button sizes reduced, spacing tightened.
- **Lobby removed large hero icon + heading** to save vertical space.
- **Removed unused `useGameStore` user selector** from RoomInformationPanel (state.user was never set by the store).
- **Verified:** `pnpm typecheck` ✅, `pnpm lint` ✅, `pnpm test` — 142/142 tests ✅

### What Changed (Files)

- `apps/web/app/lobby/[roomCode]/page.tsx` — Side-by-side grid + fixed bottom bar layout
- `apps/web/components/room-information-panel.tsx` — Compact padding/fonts
- `apps/web/components/player-list.tsx` — Compact cards, single-column list
- `apps/web/components/lobby-controls.tsx` — Horizontal inline bar layout
- `apps/web/components/lobby-controls.spec.tsx` — Updated status message assertions
- `apps/web/components/room-information-panel.spec.tsx` — Updated text assertions
- `apps/web/components/player-list.spec.tsx` — Updated player count assertions

### Why

To satisfy all acceptance criteria for FFH-107, overhauling the lobby into a compact, high-density dashboard grid viewable above the fold.

### What's Next

Start `FFH-108: Micro-Animations & Sound Engine`.

---

## 🚀 Earlier: Sprint 4 (Frictionless Entry & UI/UX Revamp)

**Date/Time:** 2026-07-09 (Local Time)
**Agent:** Freebuff (Buffy)
**Ticket:** FFH-106

### What Changed

- **Shareable Invite Link:** Added a prominent "Share Invite" button in the lobby header that copies the full invite URL (`/room/join?code=ROOMCODE`) to clipboard with a 2-second "Copied!" green confirmation state.
- **Auto-Filled Room Code:** On the Join page, when the room code is pre-filled from invite link search params (`?code=XYZ`), the Room Code input field is now locked (`disabled` + `readOnly`) with an "Auto-filled from invite link" indicator, so guests only need to enter their display name.
- **Clipboard UX:** `handleCopyInviteLink` uses `navigator.clipboard.writeText()` with `.catch()` fallback. Button transitions between "Share Invite" (share icon) and "Copied!" (checkmark icon, green styling) states.
- **Added test:** Verifies room code input is disabled, readonly, and shows the auto-filled indicator when opened via invite link.
- **Verified:** `pnpm typecheck` ✅, `pnpm lint` ✅, `pnpm test` — 142/142 tests ✅

### What Changed (Files)

- `apps/web/app/lobby/[roomCode]/page.tsx` — Added `copied` state, `handleCopyInviteLink`, and "Share Invite" button
- `apps/web/app/room/join/page.tsx` — Added `isCodeFromInvite` state, disabled input when pre-filled
- `apps/web/app/room/join/page.spec.tsx` — Added test for locked input on invite link

### Why

To satisfy all acceptance criteria for FFH-106, enabling hosts to share instant invite links that auto-fill the room code for guests.

### What's Next

Start `FFH-107: Compact Lobby Layout Redesign` (Epic 26 — NextUI-Style UI/UX Compact Revamp).

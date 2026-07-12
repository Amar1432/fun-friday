# TASKS.md (Archived: Sprints 4, 5, & 6)

_Archived from `docs/TASKS.md` on 2026-07-12. See `docs/TASKS.md` for the current Sprint 7 tasks._

---

# Sprint 4 — Frictionless Entry & UI/UX Revamp

**Sprint Goal**
Initialize NextUI in the monorepo, fix authentication edge cases, implement one-click anonymous guest access with shareable links, and redesign the UI/UX layout to be clean, compact, and completely viewable without vertical scrolling.

---

# Epic 24 — Workspace Tooling & Auth Hardening

---

## FFH-103: Initialize NextUI in Monorepo Workspace

### Description

Install and configure NextUI and Framer Motion to provide glassmorphic, animated UI components for the frontend.

### Acceptance Criteria

- `@nextui-org/react` and `framer-motion` installed in the workspace.
- `tailwind.config.ts` (or shared config) updated with the NextUI plugin.
- `NextUIProvider` successfully wraps the root layout in `apps/web`.
- `apps/web` successfully builds and starts without styling conflicts.

---

## FFH-104: Implement Global 401 Auth Interceptor

### Description

Handle expired host tokens gracefully by logging out the user instead of letting them stay stuck on restricted pages.

### Acceptance Criteria

- API client interceptor intercepts any `401 Unauthorized` responses.
- Local auth state/token is securely wiped immediately upon 401.
- User is gracefully redirected back to `/login` with an intuitive toast message.

---

# Epic 25 — Frictionless Guest Entry & Shareable Links

---

## FFH-105: Anonymous Guest Onboarding Flow

### Description

Strip away any residual authentication barriers for guests. They should only need a display name and room code to jump right in.

### Acceptance Criteria

- Guest endpoints accept `displayName` and `roomCode` with zero auth requirements.
- Room token generated for guests is scoped exclusively to their active temporary session.
- Integration tests confirm unauthenticated guests can connect to socket rooms safely.

## FFH-106: Shareable Lobby Links & Auto-Fill

### Description

Generate instant shareable invite links for hosts to distribute to players.

### Acceptance Criteria

- Host lobby UI displays a prominent "Copy Invite Link" action button.
- URL copies to clipboard in the format: `/room/join?code=D9FD81`.
- When opened by a guest, the Room Code field is locked/auto-filled, requiring only their name.

---

# Epic 26 — NextUI-Style UI/UX Compact Revamp

---

## FFH-107: Compact Lobby Layout Redesign

### Description

Overhaul the layout from the large vertical blocks seen in the current MVP to a tight, high-density dashboard grid that requires zero scrolling.

### Acceptance Criteria

- Vertical margins and padding reduced significantly across components.
- Room info panel and player list converted into a compact, side-by-side split grid.
- Primary host controls ("Start Game", "Leave Room") placed in a fixed, space-efficient header or bottom bar.
- Layout remains fully viewable above the fold on desktop screen resolutions.

## FFH-108: Micro-Animations & Sound Engine

### Description

Add responsive user feedback through subtle animations and audio toggles.

### Acceptance Criteria

- `canvas-confetti` runs immediately upon correct answers.
- Audio engine utilities loaded for correct feedback and timer warnings.
- Header includes a global persistence mute/unmute control button.

# Sprint 5 — Admin Controls & Global Polish

**Sprint Goal**
Empower the host with lobby management tools (player kicking, real-time presence monitoring), handle guest edge cases (duplicate names), and perform a complete global NextUI revamp, focusing heavily on the landing page.

---

# Epic 27 — Admin Controls & Presence

---

## FFH-109: Implement Host Kick Functionality

### Description

Allow the host to remove unwanted players from the room securely.

### Acceptance Criteria

- Backend: Create a `KickPlayer` socket event that requires host authentication.
- Backend: Target socket is forcefully disconnected and removed from Redis room state.
- Frontend: Add a "Kick" action (e.g., an 'X' icon or dropdown) to each guest card in the Host Lobby UI.
- Frontend: Kicked guest is redirected to the landing page with an alert: "You have been removed by the host."

## FFH-110: Real-Time Presence & Offline Status

### Description

Visually distinguish between players who are actively connected and those who have temporarily dropped off.

### Acceptance Criteria

- Backend: Redis state correctly flags `status: 'offline'` immediately on socket disconnect without removing the player instantly.
- Frontend: NextUI player cards apply a visual "offline" state (e.g., grayscale, reduced opacity, or an "Offline" badge) for disconnected players.
- Reconnections seamlessly remove the offline visual state.

---

# Epic 28 — Guest Experience Enhancements

---

## FFH-111: Duplicate Name Resolution

### Description

Prevent guests from being blocked from joining if someone else used their preferred display name.

### Acceptance Criteria

- Backend `JoinRoom` handler intercepts duplicate `displayName` requests.
- Logic appends a numbered suffix (e.g., "John (1)", "John (2)") if the exact name already exists in the Redis room state.
- Guest successfully connects and their UI reflects their newly suffixed name.

---

# Epic 29 — Global UI Revamp

---

## FFH-112: Landing Page Overhaul

### Description

Redesign the application root (`/`) to serve as a modern, high-converting entry point using NextUI and Framer Motion.

### Acceptance Criteria

- Hero section utilizes glassmorphism, bold typography, and a clear call-to-action ("Join Game" and "Host Game").
- Background features subtle, animated geometric shapes or gradients.
- Fully responsive on mobile, tablet, and desktop viewports.

## FFH-113: Global NextUI Consistency Audit

### Description

Ensure no legacy Tailwind-only components clash with the new NextUI aesthetic.

### Acceptance Criteria

- Host Login screen revamped with NextUI Cards and Inputs.
- Create Room flow matches the new design language.
- All toasts, modals, and error boundaries consistently use NextUI primitives.

# Sprint 6 — Game Modes & Answer Evaluation

**Sprint Goal**

Expand the MVP by introducing reusable answer evaluation, multiple game modes, and a host-driven game selection flow. The backend remains responsible for all answer validation while the frontend dynamically renders the selected game mode using a common gameplay framework.

---

# Epic 28 — Answer Evaluation Engine

---

## FFH-114: Create Answer Evaluation Module

### Description

Create a dedicated backend module responsible for evaluating player answers independently of any specific game mode.

### Acceptance Criteria

- A standalone Answer Evaluation module exists.
- Module is injectable throughout the backend.
- Evaluation logic is isolated from Socket.IO handlers.
- Public interface is documented.
- Module supports future game modes without modification.

---

## FFH-115: Implement Answer Normalization

### Description

Normalize incoming answers before evaluation.

### Acceptance Criteria

Normalization performs:

- Lowercase conversion.
- Trim leading and trailing whitespace.
- Collapse multiple spaces into a single space.
- Remove punctuation.
- Ignore hyphens.
- Ignore underscores.
- Ignore repeated whitespace.

Example expectations:

- "Spider-man"
- "Spider man"
- "spiderman"

all normalize to the same value.

---

## FFH-116: Implement Minor Typo Tolerance

### Description

Support small spelling mistakes during answer evaluation.

### Acceptance Criteria

Evaluation accepts:

- Single missing character.
- Single additional character.
- Single adjacent transposition.
- Single incorrect character.

Evaluation rejects:

- Completely different words.
- Multiple unrelated spelling mistakes.
- Incorrect movie or game titles.

Matching threshold is configurable.

---

## FFH-117: Support Multiple Accepted Answers

### Description

Allow questions to define multiple valid answers.

### Acceptance Criteria

Question evaluation supports:

- Primary answer.
- Alternate spellings.
- Common abbreviations.
- Aliases.
- Synonyms when explicitly configured.

Evaluation succeeds if any accepted answer matches.

---

## FFH-118: Create Answer Evaluation Test Suite

### Description

Validate answer matching behavior.

### Acceptance Criteria

Automated tests cover:

- Exact matches.
- Normalized matches.
- Typo tolerance.
- Alternate answers.
- Invalid answers.
- Empty answers.
- Unicode characters.
- Numbers.
- Special characters.

All tests pass.

---

# Epic 29 — Game Mode Framework

---

## FFH-119: Create Game Mode Registry

### Description

Implement a centralized registry of supported game modes.

### Acceptance Criteria

Registry contains:

- Emoji Guess.
- Bad Movie Description.
- Gibberish.

Registry provides:

- Identifier.
- Display name.
- Description.
- Icon reference.
- Rendering strategy.

Registry supports future expansion.

---

## FFH-120: Create Shared Game Mode Renderer

### Description

Build a frontend rendering layer capable of displaying different game modes.

### Acceptance Criteria

Renderer:

- Receives game type.
- Chooses correct presentation.
- Uses shared layout.
- Prevents duplicate UI implementations.

Gameplay state remains shared.

---

# Epic 30 — Emoji Guess

---

## FFH-121: Seed Emoji Guess Questions

### Description

Populate the database with Emoji Guess questions.

### Acceptance Criteria

Seed includes:

- Prompt.
- Correct answer.
- Difficulty.
- Category.
- Metadata.

Questions import successfully.

No duplicate records created.

---

## FFH-122: Build Emoji Guess Gameplay UI

### Description

Render Emoji Guess questions during gameplay.

### Acceptance Criteria

UI displays:

- Emoji prompt.
- Round information.
- Timer.
- Answer input.

Rendering remains responsive.

Correct answers are never exposed.

---

## FFH-123: Validate Emoji Guess Answers

### Description

Integrate answer evaluation with Emoji Guess.

### Acceptance Criteria

Evaluation supports:

- Normalized answers.
- Alternate spellings.
- Minor typos.

Results integrate with existing scoring flow.

---

# Epic 31 — Bad Movie Description

---

## FFH-124: Seed Bad Movie Description Questions

### Description

Populate the database with Bad Movie Description content.

### Acceptance Criteria

Each question contains:

- Description.
- Correct answer.
- Difficulty.
- Category.
- Metadata.

Seeds execute successfully.

---

## FFH-125: Build Bad Movie Description UI

### Description

Render movie descriptions during gameplay.

### Acceptance Criteria

UI displays:

- Description text.
- Round number.
- Countdown timer.
- Answer input.

Layout remains consistent with shared gameplay screen.

---

## FFH-126: Validate Bad Movie Description Answers

### Description

Integrate answer evaluation.

### Acceptance Criteria

Evaluation supports:

- Exact match.
- Normalized match.
- Alternate movie titles.
- Minor spelling mistakes.

Scoring integrates with existing engine.

---

# Epic 32 — Gibberish

---

## FFH-127: Seed Gibberish Questions

### Description

Populate the database with Gibberish questions.

### Acceptance Criteria

Each record contains:

- Gibberish phrase.
- Correct answer.
- Difficulty.
- Category.
- Metadata.

Seeds execute without duplication.

---

## FFH-128: Build Gibberish Gameplay UI

### Description

Render Gibberish prompts.

### Acceptance Criteria

UI displays:

- Gibberish text.
- Round information.
- Timer.
- Answer input.

Presentation matches application design system.

---

## FFH-129: Validate Gibberish Answers

### Description

Integrate fuzzy matching with Gibberish.

### Acceptance Criteria

Evaluation supports:

- Exact matches.
- Space normalization.
- Hyphen normalization.
- Typo tolerance.

Incorrect answers are rejected.

---

# Epic 33 — Host Game Selection

---

## FFH-130: Build Game Selection Screen

### Description

Allow hosts to choose a game before starting a room.

### Acceptance Criteria

Screen displays:

- Available games.
- Game descriptions.
- Icons.
- Question count (if available).

Only supported games appear.

---

## FFH-131: Build Game Selection Cards

### Description

Create reusable game selection components.

### Acceptance Criteria

Each card displays:

- Game name.
- Description.
- Icon.
- Selection state.

Selected game is visually distinguishable.

Tailwind CSS styling is applied consistently.

---

## FFH-132: Persist Selected Game

### Description

Store the host's selected game for the room.

### Acceptance Criteria

Selection is:

- Saved before gameplay.
- Included in room state.
- Available after reconnect.
- Used when loading question sets.

Changing the game replaces any previous selection.

---

## FFH-133: Load Selected Question Bank

### Description

Load questions for the chosen game mode.

### Acceptance Criteria

Question loader:

- Uses selected game identifier.
- Retrieves only matching questions.
- Honors existing filtering rules.
- Loads questions into Redis.

No questions from other game modes are included.

---

# Epic 34 — End-to-End Validation

---

## FFH-134: Validate Complete Game Mode Flow

### Description

Verify the complete experience for all supported game modes.

### Acceptance Criteria

Validated flow:

- Host selects game.
- Room created.
- Guests join.
- Questions load.
- Gameplay starts.
- Answers submitted.
- Answers evaluated.
- Scores updated.
- Leaderboard displayed.
- Game completes.

Flow succeeds for:

- Emoji Guess.
- Bad Movie Description.
- Gibberish.

No blocking issues remain.

---

## FFH-135: Perform Regression Validation

### Description

Ensure new game modes do not impact existing multiplayer functionality.

### Acceptance Criteria

Regression testing confirms:

- Authentication remains functional.
- Room lifecycle remains functional.
- Socket events remain unchanged.
- Reconnection works.
- Leaderboard updates correctly.
- Existing scoring pipeline functions correctly.
- Redis state remains consistent.
- PostgreSQL persistence remains correct.

All existing MVP functionality continues to operate successfully.

# TASKS.md

# Fun Friday Hub — Sprint 1 (MVP Scaffolding & Infrastructure)

**Sprint Goal**

Establish the project foundation by creating a production-ready monorepo, configuring the frontend and backend applications, setting up the database layer, and implementing Host Authentication using Google/Microsoft SSO.

---

# Epic 1 — Monorepo Foundation

---

## FFH-001: Initialize pnpm Workspace

### Description

Create the root monorepo using pnpm v10.

### Acceptance Criteria

- pnpm workspace is initialized.
- Workspace configuration file exists.
- Root package.json is configured for workspaces.
- Node.js engine version is defined.
- Package manager is locked to pnpm v10.
- Repository installs successfully using a single `pnpm install`.
- No dependency resolution warnings exist.

---

## FFH-002: Configure Monorepo Directory Structure

### Description

Create the standard project folder layout.

### Acceptance Criteria

The repository contains:

```text
apps/
packages/
prisma/
docs/
scripts/
```

Inside apps:

```text
apps/web
apps/api
```

Inside packages:

```text
packages/config
packages/types
packages/ui
packages/eslint-config
packages/tsconfig
```

No placeholder code exists beyond scaffolding.

---

## FFH-003: Configure Shared TypeScript Settings

### Description

Create reusable TypeScript configurations.

### Acceptance Criteria

- Root TypeScript configuration exists.
- Shared tsconfig package exists.
- Frontend extends shared configuration.
- Backend extends shared configuration.
- Path aliases are supported.
- Strict mode is enabled.
- Incremental compilation is enabled.

---

## FFH-004: Configure Shared ESLint

### Description

Provide a reusable lint configuration.

### Acceptance Criteria

- Shared ESLint configuration package exists.
- Web uses shared configuration.
- API uses shared configuration.
- Root lint command executes successfully.
- No lint errors after fresh scaffold.

---

## FFH-005: Configure Prettier

### Description

Create project-wide formatting rules.

### Acceptance Criteria

- Root prettier configuration exists.
- Ignore file exists.
- Formatting command runs successfully.
- All scaffolded files are formatted.

---

## FFH-006: Configure Git Hooks

### Description

Prevent invalid commits.

### Acceptance Criteria

- Pre-commit hook exists.
- Lint executes before commit.
- Formatting check executes before commit.
- Commit is blocked when checks fail.

---

## FFH-007: Configure Environment Variable Strategy

### Description

Standardize environment configuration.

### Acceptance Criteria

Environment templates exist for:

- Root
- Frontend
- Backend

Variables are documented.

Sensitive values are excluded from version control.

---

# Epic 2 — Frontend Foundation

---

## FFH-008: Scaffold Next.js Application

### Description

Create the frontend application.

### Acceptance Criteria

- Next.js application exists under apps/web.
- TypeScript enabled.
- App Router enabled.
- Application starts successfully.
- Production build succeeds.

---

## FFH-009: Configure Tailwind CSS

### Description

Install and configure Tailwind.

### Acceptance Criteria

- Tailwind configured.
- Global styles configured.
- Development server renders Tailwind styles.
- Production build succeeds.

---

## FFH-010: Configure Shared UI Package

### Description

Prepare reusable UI package.

### Acceptance Criteria

- packages/ui exists.
- Frontend imports package successfully.
- Build succeeds.
- No circular dependencies.

---

## FFH-011: Configure Frontend Environment Variables

### Description

Connect frontend runtime configuration.

### Acceptance Criteria

Frontend can access:

- API URL
- Auth callback URL
- Public application name

Configuration loads correctly in development.

---

# Epic 3 — Backend Foundation

---

## FFH-012: Scaffold NestJS API

### Description

Create backend service.

### Acceptance Criteria

- NestJS application exists.
- TypeScript enabled.
- API starts successfully.
- Health endpoint responds successfully.

---

## FFH-013: Configure Global Validation

### Description

Enable request validation.

### Acceptance Criteria

- Global validation pipe enabled.
- Unknown fields rejected.
- Invalid payloads return validation errors.
- DTO validation enabled.

---

## FFH-014: Configure Global Exception Handling

### Description

Create consistent API error responses.

### Acceptance Criteria

- Global exception filter configured.
- Validation errors are standardized.
- Internal server errors return consistent format.
- Stack traces hidden in production.

---

## FFH-015: Configure API Logging

### Description

Add structured request logging.

### Acceptance Criteria

Logs include:

- Method
- URL
- Status
- Response time
- Request ID

Logging works in development.

---

## FFH-016: Configure CORS

### Description

Allow frontend communication.

### Acceptance Criteria

- Frontend origin configurable.
- Credentials supported.
- Invalid origins rejected.

---

# Epic 4 — Database Layer

---

## FFH-017: Configure Prisma

### Description

Initialize Prisma.

### Acceptance Criteria

- Prisma initialized.
- Schema directory configured.
- Prisma client generated.
- Generation succeeds.

---

## FFH-018: Configure PostgreSQL Connection

### Description

Connect Prisma to PostgreSQL.

### Acceptance Criteria

- Database URL configured.
- Connection verified.
- Startup succeeds.
- Connection errors handled gracefully.

---

## FFH-019: Create Initial Database Schema

### Description

Add project schema.

### Acceptance Criteria

Schema includes:

- User
- Room
- Player
- Game
- Question
- Round
- Answer

Relations match architecture documentation.

Schema validates successfully.

---

## FFH-020: Configure Prisma Migrations

### Description

Enable migration workflow.

### Acceptance Criteria

- Initial migration created.
- Migration executes successfully.
- Database tables created.
- Migration history stored.

---

## FFH-021: Configure Prisma Client Module

### Description

Integrate Prisma into NestJS.

### Acceptance Criteria

- Singleton Prisma service created.
- Graceful shutdown implemented.
- Dependency injection configured.
- Database accessible from modules.

---

# Epic 5 — Authentication

---

## FFH-022: Configure Authentication Module

### Description

Create authentication module.

### Acceptance Criteria

- Authentication module exists.
- Authentication service exists.
- Authentication controller exists.
- Module loads successfully.

---

## FFH-023: Configure JWT Infrastructure

### Description

Prepare application JWT support.

### Acceptance Criteria

- JWT secret configurable.
- Token expiration configurable.
- Signing service implemented.
- Verification service implemented.

---

## FFH-024: Configure Google OAuth Provider

### Description

Enable Google SSO.

### Acceptance Criteria

- Google provider configured.
- Callback endpoint exists.
- User profile parsed.
- Existing users identified correctly.
- New users created automatically.

---

## FFH-025: Configure Microsoft OAuth Provider

### Description

Enable Microsoft SSO.

### Acceptance Criteria

- Microsoft provider configured.
- Callback endpoint exists.
- User profile parsed.
- Existing users identified correctly.
- New users created automatically.

---

## FFH-026: Persist Host User

### Description

Store authenticated hosts.

### Acceptance Criteria

- User record created on first login.
- Existing user reused.
- Duplicate users prevented.
- Email uniqueness enforced.

---

## FFH-027: Issue Application JWT

### Description

Generate application access token.

### Acceptance Criteria

JWT contains:

- User ID
- Email
- Name

Expiration configured.

Signing verified.

---

## FFH-028: Protect Authenticated Endpoints

### Description

Create JWT guard.

### Acceptance Criteria

- Guard implemented.
- Invalid token rejected.
- Missing token rejected.
- Valid token accepted.

---

# Epic 6 — Frontend Authentication

---

## FFH-029: Build Login Screen

### Description

Create host login page.

### Acceptance Criteria

Page contains:

- Application branding
- Google sign-in button
- Microsoft sign-in button
- Loading state
- Error state

Responsive layout implemented.

---

## FFH-030: Implement Google Login Flow

### Description

Connect Google authentication.

### Acceptance Criteria

- Login button initiates authentication.
- Successful login redirects correctly.
- Failed login displays error.
- Loading state shown during authentication.

---

## FFH-031: Implement Microsoft Login Flow

### Description

Connect Microsoft authentication.

### Acceptance Criteria

- Login button initiates authentication.
- Successful login redirects correctly.
- Failed login displays error.
- Loading state shown during authentication.

---

## FFH-032: Store Authentication Session

### Description

Persist authenticated host session.

### Acceptance Criteria

- Access token stored securely.
- Session restored after refresh.
- Logout clears session.
- Unauthorized users redirected to login.

---

## FFH-033: Build Protected Dashboard Shell

### Description

Create authenticated landing page.

### Acceptance Criteria

Dashboard contains:

- Header
- User information
- Placeholder navigation
- Placeholder content area

Unauthenticated access is blocked.

---

# Epic 7 — Quality & CI

---

## FFH-034: Configure Testing Framework

### Description

Prepare testing infrastructure.

### Acceptance Criteria

- Frontend test runner configured.
- Backend test runner configured.
- Sample tests execute successfully.
- Coverage reporting enabled.

---

## FFH-035: Configure GitHub Actions

### Description

Create continuous integration pipeline.

### Acceptance Criteria

Pipeline performs:

- Install dependencies
- Type checking
- Linting
- Testing
- Production build

Pipeline completes successfully.

---

## FFH-036: Verify Full Project Build

### Description

Validate Sprint 1 deliverables.

### Acceptance Criteria

The following commands complete successfully:

- Install dependencies
- Generate Prisma client
- Run database migration
- Start backend
- Start frontend
- Run tests
- Run lint
- Run production build

No blocking errors remain.

---

# Sprint 1 Definition of Done

Sprint 1 is complete when:

- pnpm monorepo is fully operational.
- Next.js application runs successfully.
- NestJS application runs successfully.
- PostgreSQL connects through Prisma.
- Initial migration executes successfully.
- Google SSO login works.
- Microsoft SSO login works.
- Host receives application JWT.
- Protected routes function correctly.
- CI pipeline passes.
- Linting passes.
- Tests execute successfully.
- Production builds succeed for both applications.

# Sprint 2 — Core Game Loop & Real-Time Engine

**Sprint Goal**

Implement the real-time multiplayer engine using Socket.IO and Redis. All transient game state (rooms, players, timers, rounds, scores, and live events) will be managed in Redis. PostgreSQL remains the source of truth only for persistent data before and after gameplay.

---

# Epic 8 — Redis Infrastructure

---

## FFH-037: Configure Redis Connection

### Description

Integrate Redis into the NestJS application as the primary ephemeral state store.

### Acceptance Criteria

- Redis connection is established during application startup.
- Connection settings are configurable through environment variables.
- Connection failures are logged clearly.
- Automatic reconnection strategy is configured.
- Application starts successfully when Redis is available.
- Health checks can verify Redis connectivity.

---

## FFH-038: Create Redis Service

### Description

Create a centralized Redis service for application-wide usage.

### Acceptance Criteria

- Redis service is injectable throughout the application.
- Read, write, delete, and expiration operations are supported.
- Connection lifecycle is managed cleanly.
- No module creates independent Redis connections.

---

## FFH-039: Define Redis Room State Schema

### Description

Design the Redis data structures used during active gameplay.

### Acceptance Criteria

State definitions exist for:

- Room
- Connected players
- Player readiness
- Current round
- Current question
- Timer
- Leaderboard
- Submitted answers
- Active game status

All structures are documented and consistent across services.

---

## FFH-040: Implement Redis Room Repository

### Description

Create a repository layer for room state operations.

### Acceptance Criteria

Repository supports:

- Create room state
- Read room state
- Update room state
- Delete room state
- Set expiration
- Atomic updates where required

No business logic exists inside the repository.

---

# Epic 9 — Socket.IO Foundation

---

## FFH-041: Configure Socket.IO Gateway

### Description

Create the primary WebSocket gateway for the application.

### Acceptance Criteria

- Gateway initializes successfully.
- Namespace configuration matches project architecture.
- CORS configuration matches frontend requirements.
- Client connections are accepted.
- Client disconnections are detected.
- Gateway startup is logged.

---

## FFH-042: Configure Socket Authentication

### Description

Authenticate WebSocket connections using JWT.

### Acceptance Criteria

- Host JWT validation is supported.
- Guest JWT validation is supported.
- Invalid tokens are rejected.
- Expired tokens are rejected.
- Authenticated identity is available throughout the socket lifecycle.

---

## FFH-043: Implement Socket Event Logging

### Description

Provide structured logging for all socket activity.

### Acceptance Criteria

Logs include:

- Socket ID
- Player ID
- Room ID
- Event name
- Timestamp
- Processing duration

Sensitive information is never logged.

---

# Epic 10 — Room Lifecycle

---

## FFH-044: Implement JoinRoom Event

### Description

Implement the JoinRoom WebSocket event defined in ROOM_PROTOCOL.md.

### Acceptance Criteria

- Authenticated player joins room successfully.
- Room existence is validated.
- Room capacity rules are enforced.
- Duplicate connections are handled correctly.
- Player state is stored in Redis.
- Other clients receive the appropriate room update event.
- Invalid requests return protocol-compliant error events.

---

## FFH-045: Implement LeaveRoom Event

### Description

Implement the LeaveRoom event.

### Acceptance Criteria

- Player is removed from Redis room state.
- Socket leaves the room.
- Remaining players receive updated room state.
- Empty rooms are cleaned up according to lifecycle rules.
- Host disconnect behavior follows protocol definition.

---

## FFH-046: Implement Player Reconnection

### Description

Support reconnecting players after temporary connection loss.

### Acceptance Criteria

- Existing player identity is restored.
- Previous session state is recovered.
- Duplicate player records are not created.
- Active game state is synchronized after reconnection.
- Player receives current room state immediately after reconnect.

---

## FFH-047: Implement Connection Cleanup

### Description

Handle unexpected socket disconnects.

### Acceptance Criteria

- Temporary disconnects are distinguished from intentional leaves.
- Player status is updated appropriately.
- Room state remains consistent.
- Cleanup executes only after configured timeout.
- Orphaned connections are removed safely.

---

# Epic 11 — Lobby Management

---

## FFH-048: Implement PlayerReady Event

### Description

Implement the PlayerReady event defined in ROOM_PROTOCOL.md.

### Acceptance Criteria

- Ready status is stored in Redis.
- Player readiness can be toggled.
- Duplicate updates are ignored.
- Room state changes are broadcast.
- Host receives updated readiness information.

---

## FFH-049: Implement RoomStateUpdated Broadcast

### Description

Broadcast complete room state whenever lobby state changes.

### Acceptance Criteria

Broadcast includes:

- Connected players
- Ready status
- Host information
- Room status
- Player count

Payload matches ROOM_PROTOCOL.md.

---

## FFH-050: Validate Game Start Preconditions

### Description

Verify lobby requirements before gameplay begins.

### Acceptance Criteria

Validation includes:

- Host connected
- Minimum player count
- Required ready players
- Room status
- Valid game configuration

Failures return protocol-compliant error events.

---

# Epic 12 — Game Lifecycle

---

## FFH-051: Implement StartGame Event

### Description

Implement the StartGame event.

### Acceptance Criteria

- Only host can start game.
- Preconditions are validated.
- Room status changes appropriately.
- Initial game state is created in Redis.
- First round initialization begins.
- Clients receive protocol-compliant event.

---

## FFH-052: Load Question Set into Redis

### Description

Prepare game questions before gameplay begins.

### Acceptance Criteria

- Questions are loaded from PostgreSQL.
- Question ordering follows game configuration.
- Correct answers remain server-side only.
- Redis stores required runtime state.
- Duplicate question loading is prevented.

---

## FFH-053: Implement QuestionStarted Event

### Description

Broadcast new round information.

### Acceptance Criteria

Players receive:

- Round number
- Question identifier
- Prompt
- Metadata
- Allowed response duration

Correct answer is never included.

---

## FFH-054: Implement Timer Engine

### Description

Create the server-side countdown system.

### Acceptance Criteria

- Timer begins automatically when round starts.
- Timer executes on the server only.
- Timer state is stored in Redis.
- Timer accuracy remains consistent.
- Timer stops correctly at expiration.

---

## FFH-055: Implement TimerTick Broadcast

### Description

Broadcast timer updates during active rounds.

### Acceptance Criteria

- Tick interval matches ROOM_PROTOCOL.md.
- Remaining time is synchronized.
- All connected clients receive updates.
- Broadcasts stop immediately after timer completion.

---

## FFH-056: Implement Round Completion

### Description

Complete a round after timer expiration.

### Acceptance Criteria

- Timer stops.
- Late answers are rejected.
- Final scoring begins.
- Next game state transition is triggered.
- Clients receive protocol-compliant completion event.

---

# Epic 13 — Answer Processing

---

## FFH-057: Implement SubmitAnswer Event

### Description

Implement the SubmitAnswer event defined in ROOM_PROTOCOL.md.

### Acceptance Criteria

- Only one answer per player per round is accepted.
- Duplicate submissions are rejected.
- Response time is captured.
- Answer stored in Redis.
- Submission acknowledgement returned.
- Invalid submissions return protocol-compliant error events.

---

## FFH-058: Validate Submitted Answers

### Description

Evaluate submitted answers.

### Acceptance Criteria

Validation includes:

- Correctness
- Round status
- Submission timing
- Player eligibility

Evaluation occurs server-side only.

---

## FFH-059: Calculate Player Scores

### Description

Compute scores for completed rounds.

### Acceptance Criteria

Scoring considers:

- Correct answer
- Response time
- Existing score

Redis leaderboard updates atomically.

---

## FFH-060: Persist Completed Round Data

### Description

Flush completed round information to PostgreSQL.

### Acceptance Criteria

Persisted data includes:

- Player answers
- Correctness
- Response time
- Round reference

Redis remains authoritative until persistence completes successfully.

---

## FFH-061: Implement LeaderboardUpdated Broadcast

### Description

Broadcast updated leaderboard after scoring.

### Acceptance Criteria

Leaderboard includes:

- Player
- Rank
- Score
- Score delta (if defined by protocol)

Ordering is deterministic.

Payload matches ROOM_PROTOCOL.md.

---

# Epic 14 — Game Completion

---

## FFH-062: Implement Game Completion Flow

### Description

Handle end-of-game state transitions.

### Acceptance Criteria

- Final leaderboard generated.
- Room status updated.
- Redis game state finalized.
- Clients receive completion event.
- Post-game persistence begins.

---

## FFH-063: Cleanup Redis Game State

### Description

Remove expired game data after completion.

### Acceptance Criteria

- Temporary Redis keys removed.
- Active timers cleared.
- Socket room cleaned.
- Expiration policy applied.
- No orphaned state remains.

---

# Epic 15 — Reliability & Validation

---

## FFH-064: Implement Protocol Validation

### Description

Validate all incoming WebSocket payloads.

### Acceptance Criteria

- Every incoming event validates against protocol DTOs.
- Invalid payloads return standardized error events.
- Unexpected fields are rejected.
- Validation is applied consistently across all events.

---

## FFH-065: Implement Socket Integration Tests

### Description

Create automated integration tests covering the complete real-time game flow.

### Acceptance Criteria

Tests verify:

- Connection
- Authentication
- JoinRoom
- LeaveRoom
- Reconnect
- PlayerReady
- StartGame
- QuestionStarted
- TimerTick
- SubmitAnswer
- LeaderboardUpdated
- Game completion

All tests pass successfully in CI.

# Sprint 3 — Frontend Integration & Player/Host UI

**Sprint Goal**

Integrate the Next.js frontend with the real-time Socket.IO backend, establish a global client-side state architecture, and build the complete Host and Guest user interfaces required for the MVP gameplay experience.

---

# Epic 16 — Real-Time Frontend Infrastructure

---

## FFH-066: Configure Socket.IO Client

### Description

Integrate the Socket.IO client into the Next.js application.

### Acceptance Criteria

- Socket.IO client dependency is installed.
- Connection URL is configurable through environment variables.
- Connection is established only when required.
- Automatic reconnection is enabled.
- Connection status is exposed to the application.
- Development and production configurations are supported.

---

## FFH-067: Create Socket Provider

### Description

Create a shared provider responsible for managing the socket connection.

### Acceptance Criteria

- Single socket instance exists per browser session.
- Provider is accessible throughout the application.
- Connection lifecycle is managed automatically.
- Cleanup occurs on application unmount.
- No duplicate socket connections are created.

---

## FFH-068: Implement Socket Event Registry

### Description

Centralize registration and cleanup of WebSocket event listeners.

### Acceptance Criteria

- Event listeners are registered from one location.
- Duplicate listeners are prevented.
- Listener cleanup occurs automatically.
- Event names align with ROOM_PROTOCOL.md.
- Unknown events are safely ignored.

---

## FFH-069: Build Connection Status Indicator

### Description

Display current socket connection state.

### Acceptance Criteria

UI supports:

- Connecting
- Connected
- Reconnecting
- Disconnected
- Authentication failed

Indicator updates automatically.

---

# Epic 17 — Global Real-Time State

---

## FFH-070: Configure Global State Management

### Description

Create the application's global real-time state layer.

### Acceptance Criteria

Global state includes:

- Current user
- Current room
- Connected players
- Game status
- Current round
- Timer
- Leaderboard
- Connection status

State is accessible from any page.

### Status

**COMPLETED** - Implemented as a comprehensive Zustand store with room, player, game, and leaderboard state slices. Includes Socket.IO event synchronization via `useSocketSync` hook.

---

## FFH-071: Implement Room Store

### Description

Manage room information inside global state.

### Acceptance Criteria

Store supports:

- Room creation
- Room updates
- Room reset
- Host information
- Room status
- Room code

Updates occur only through defined actions.

### Status

**COMPLETED** - Implemented as part of FFH-070. Room state slice with `setRoom` and `resetRoom` actions.

---

## FFH-072: Implement Player Store

### Description

Manage connected player state.

### Acceptance Criteria

Store supports:

- Add player
- Remove player
- Update player
- Ready state
- Score updates
- Connection state

Ordering remains deterministic.

### Status

**COMPLETED** - Implemented as part of FFH-070. Player state slice with `addPlayer`, `removePlayer`, `updatePlayer`, and deterministic sorting.

---

## FFH-073: Implement Game Store

### Description

Track active gameplay state.

### Acceptance Criteria

Store maintains:

- Current question
- Current round
- Timer
- Submitted answer
- Remaining time
- Game phase

State updates from WebSocket events only.

### Status

**COMPLETED** - Implemented as part of FFH-070. Game state slice with question, timer, round tracking, and game phase management.

---

## FFH-074: Synchronize Socket Events with State

### Description

Connect incoming socket events to the global store.

### Acceptance Criteria

Every event defined in ROOM_PROTOCOL.md updates the correct state slice.

No duplicated state mutations occur.

State remains synchronized after reconnect.

### Status

**COMPLETED** - Implemented as part of FFH-070. `useSocketSync` hook and `SocketSyncRoot` component provide automatic event-to-state synchronization.

---

# Epic 18 — Host Dashboard

---

## FFH-075: Build Host Dashboard Layout

### Description

Create the authenticated host workspace.

### Acceptance Criteria

Layout includes:

- Header
- Navigation
- Main content area
- Responsive behavior

Tailwind CSS styling is applied consistently.

### Status

**COMPLETED** - Dashboard layout implemented in `apps/web/app/dashboard/page.tsx` with header, sidebar navigation, responsive grid layout, and consistent Tailwind CSS styling.

---

## FFH-076: Build Create Room Screen

### Description

Allow hosts to create new game rooms.

### Acceptance Criteria

Screen includes:

- Create room action
- Loading state
- Error state
- Success feedback
- Generated room code

Navigation proceeds to lobby after creation.

### Status

**COMPLETED** - Implemented complete create room screen at `apps/web/app/room/create/page.tsx` with API integration, loading/error states, success feedback with room code display, copy functionality, and auto-navigation to lobby.

---

## FFH-077: Build Room Information Panel

### Description

Display room metadata.

### Acceptance Criteria

Panel displays:

- Room code
- Room status
- Connected players
- Host information
- Current game state

Values update automatically.

### Status

**COMPLETED** - Implemented the `RoomInformationPanel` component at `apps/web/components/room-information-panel.tsx` which renders room code, status, host info, connected players, and game progress from the Zustand store. Added a unit test suite to fully cover its functionality and verified that lint and type checks pass.

---

## FFH-078: Build Player List Component

### Description

Display all connected players.

### Acceptance Criteria

Player cards display:

- Display name
- Ready state
- Score
- Connection status

List updates immediately from socket events.

---

## FFH-079: Build Lobby Controls

### Description

Provide host controls before gameplay begins.

### Acceptance Criteria

Controls include:

- Start game
- Player count
- Ready player count

Unavailable actions are visually disabled.

---

## FFH-080: Connect StartGame Event

### Description

Wire Start Game button to the Socket.IO event.

### Acceptance Criteria

- Button emits StartGame event.
- Loading state displayed.
- Duplicate clicks prevented.
- Errors displayed appropriately.
- Successful response transitions UI.

---

# Epic 19 — Guest Experience

---

## FFH-081: Build Join Room Screen

### Description

Create guest entry page.

### Acceptance Criteria

Screen contains:

- Room code input
- Display name input
- Join button
- Validation errors
- Loading state

Tailwind styling applied.

---

## FFH-082: Validate Join Form

### Description

Validate guest input before submission.

### Acceptance Criteria

Validation includes:

- Room code format
- Display name length
- Empty fields
- Invalid characters

Invalid submissions never reach the server.

---

## FFH-083: Connect JoinRoom Flow

### Description

Wire guest join flow to authentication and WebSocket connection.

### Acceptance Criteria

Flow performs:

- Guest authentication
- Socket authentication
- JoinRoom event
- Room synchronization

Successful joins navigate to waiting room.

---

## FFH-084: Build Waiting Room Screen

### Description

Display lobby while waiting for the game to begin.

### Acceptance Criteria

Screen displays:

- Room code
- Connected players
- Ready status
- Host information
- Waiting message

Updates occur in real time.

---

## FFH-085: Build Player Ready Control

### Description

Allow guests to toggle readiness.

### Acceptance Criteria

Ready control:

- Toggles state
- Emits PlayerReady event
- Updates immediately
- Prevents duplicate requests

---

# Epic 20 — Gameplay UI

---

## FFH-086: Build Game Screen Layout

### Description

Create the primary gameplay interface.

### Acceptance Criteria

Layout includes:

- Question area
- Timer
- Answer area
- Player status
- Responsive layout

Tailwind CSS used consistently.

---

## FFH-087: Build Question Display Component

### Description

Render the active question.

### Acceptance Criteria

Component displays:

- Prompt
- Metadata
- Round number

Correct answer is never rendered.

---

## FFH-088: Build Countdown Timer Component

### Description

Display remaining round time.

### Acceptance Criteria

Timer:

- Updates from TimerTick events
- Stops automatically
- Resets each round
- Handles reconnect correctly

---

## FFH-089: Build Answer Submission Component

### Description

Allow players to submit answers.

### Acceptance Criteria

Component supports:

- Text input or game-specific interaction
- Submit button
- Disabled state after submission
- Loading state

Duplicate submissions prevented.

---

## FFH-090: Connect SubmitAnswer Event

### Description

Wire answer submission to Socket.IO.

### Acceptance Criteria

- SubmitAnswer event emitted.
- Submission acknowledgement handled.
- Errors displayed.
- UI locked after successful submission.

---

## FFH-091: Display Round Completion State

### Description

Show transition after timer expiration.

### Acceptance Criteria

Screen displays:

- Waiting message
- Submission status
- Transition indicator

No additional submissions allowed.

---

# Epic 21 — Leaderboard

---

## FFH-092: Build Live Leaderboard Component

### Description

Display player rankings.

### Acceptance Criteria

Leaderboard displays:

- Rank
- Player name
- Score
- Score change (if available)

Ordering matches backend.

---

## FFH-093: Synchronize Leaderboard Updates

### Description

Update leaderboard from LeaderboardUpdated events.

### Acceptance Criteria

Updates occur automatically.

Animations do not affect ranking accuracy.

No duplicate entries appear.

---

## FFH-094: Build Game Completion Screen

### Description

Display final game results.

### Acceptance Criteria

Screen includes:

- Final rankings
- Winner
- Player scores
- Return action

Displayed after GameCompleted event.

---

# Epic 22 — Event Wiring

---

## FFH-095: Implement Incoming Event Handlers

### Description

Connect all incoming Socket.IO events to UI updates.

### Acceptance Criteria

Handlers exist for every event defined in ROOM_PROTOCOL.md.

Each event updates the correct UI.

Unhandled events are logged safely.

---

## FFH-096: Implement Outgoing Event Dispatcher

### Description

Centralize outgoing WebSocket event emission.

### Acceptance Criteria

Dispatcher supports:

- JoinRoom
- LeaveRoom
- PlayerReady
- StartGame
- SubmitAnswer
- Reconnect

Components never emit socket events directly.

---

## FFH-097: Handle Socket Errors

### Description

Provide user-friendly error handling.

### Acceptance Criteria

Errors include:

- Lost connection
- Authentication failure
- Invalid room
- Invalid action
- Server unavailable

Recovery actions are displayed when applicable.

---

## FFH-098: Implement Reconnection Recovery UI

### Description

Recover gracefully after temporary network interruptions.

### Acceptance Criteria

Application:

- Detects reconnection
- Restores state
- Synchronizes room
- Removes stale UI
- Displays reconnection status

---

# Epic 23 — Responsive UI & Polish

---

## FFH-099: Optimize Responsive Layouts

### Description

Ensure all interfaces function across supported viewport sizes.

### Acceptance Criteria

Pages verified:

- Login
- Host dashboard
- Lobby
- Waiting room
- Gameplay
- Leaderboard

Layouts remain usable without horizontal scrolling.

---

## FFH-100: Add Loading, Empty & Error States

### Description

Complete all user feedback states.

### Acceptance Criteria

Every major screen includes:

- Loading state
- Empty state
- Error state
- Retry action where appropriate

No blank screens remain.

---

## FFH-101: Implement Accessibility Improvements

### Description

Improve accessibility across the frontend.

### Acceptance Criteria

UI includes:

- Keyboard navigation
- Visible focus states
- Semantic HTML
- Accessible labels
- Screen reader friendly controls

---

## FFH-102: Perform End-to-End Frontend Validation

### Description

Validate the complete frontend integration.

### Acceptance Criteria

Verified user journeys:

- Host login
- Room creation
- Guest join
- Waiting room
- Player ready
- Game start
- Question display
- Answer submission
- Leaderboard updates
- Game completion
- Reconnection recovery

All critical user flows complete successfully without blocking issues.

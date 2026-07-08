# TASKS.md

_(Note: For completed Sprint 1 & 2 tasks, see `docs/archive/SPRINT_1_AND_2_TASKS.md`)_

# Sprint 3 — Frontend Integration & Player/Host UI

**Sprint Goal**

Integrate the Next.js frontend with the real-time Socket.IO backend, establish a global client-side state architecture, and build the complete Host and Guest user interfaces required for the MVP gameplay experience.

---

# Epic 19 — Guest Experience

---

_(Note: FFH-081 and FFH-082 are completed)_

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

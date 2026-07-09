# TASKS.md

_(Note: For completed Sprint 1 & 2 tasks, see `docs/archive/SPRINT_1_2_AND_3_TASKS.md`)_

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

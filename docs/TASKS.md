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

# Active Task

**Ticket:** FFH-105
**Title:** Anonymous Guest Onboarding Flow

## Objective

Strip away any residual authentication barriers for guests. They should only need a display name and room code to jump right in.

## Execution Requirements

1. **Guest Endpoints:** Verify guest endpoints accept `displayName` and `roomCode` with zero auth requirements. The backend `/auth/guest` endpoint already exists — confirm it works without an Authorization header.
2. **Room Token Scoping:** Ensure the room token generated for guests is scoped exclusively to their active temporary session (not a persistent JWT).
3. **Integration Tests:** Write or confirm integration tests that unauthenticated guests can connect to socket rooms safely.

## Completion

Once the guest auth flow is hardened and verified, commit the changes, update `docs/HANDOFF.md`, and update this file to point to the next logical step.

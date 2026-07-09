# Active Task

**Ticket:** FFH-110
**Title:** Real-Time Presence & Offline Status

## Objective

Visually distinguish between players who are actively connected and those who have temporarily dropped off. Players should see an immediate visual indicator when someone disconnects, and the offline state should be seamlessly removed on reconnection.

## Execution Requirements

1. **Backend:** `handleDisconnect` immediately broadcasts `RoomStateUpdated` (with `isConnected: false`) after marking the player as disconnected in Redis, so all remaining clients see the offline state right away.
2. **Frontend (Lobby):** PlayerList applies `opacity-50 grayscale` styling to disconnected player cards, plus an amber connection dot and "Offline" badge.
3. **Frontend (Gameplay):** IN_PROGRESS sidebar player entries show `opacity-60 grayscale`, amber connection dot, and an "Offline" badge for disconnected players.
4. **Reconnection:** `handleReconnect` already clears the disconnected flag and broadcasts updated state — the frontend visuals revert seamlessly.

## Completion

Stage, commit, update `docs/HANDOFF.md`, and update this file to point to the next logical step.

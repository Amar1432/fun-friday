# Active Task

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

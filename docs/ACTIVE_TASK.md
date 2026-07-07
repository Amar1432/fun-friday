# Active Task

## FFH-064: Implement Protocol Validation

### Description

Validate all incoming WebSocket payloads using NestJS `ValidationPipe` and `class-validator` decorators.

### Acceptance Criteria

- All incoming WebSocket event payloads validated using `class-validator`.
- Invalid payloads rejected with a structured error event before any business logic runs.
- Validation DTOs created for all `@SubscribeMessage` handlers.
- Unit tests cover both valid and invalid payload scenarios.

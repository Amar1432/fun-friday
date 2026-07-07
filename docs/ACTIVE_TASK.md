# Active Task

**Ticket:** FFH-038
**Title:** Create Redis Service

## Objective

Extend `RedisService` to support standard read, write, delete, and expiration operations for application-wide usage.

## Execution Requirements

1. **Operations Support:** Add strongly-typed helper methods for standard Redis operations (e.g., `set`, `get`, `del`, `expire`, etc.) on the Redis client.
2. **Lifecycle and Connection Management:** Maintain the singleton connection and ensure other modules use this service instead of creating independent connections.
3. **Unit Tests:** Add comprehensive unit tests in `redis.service.spec.ts` covering these new operations.

# Redis Ephemeral State Schema

This document defines the strict data structures and key naming conventions used in Redis for managing transient game state. All rapid, real-time operations (player connections, room lobby, round transitions, active timer tick, and live leaderboard calculations) must adhere to these schemas.

## Production Redis

**Provider:** [Redis Cloud](https://redis.io/cloud) (Redis Labs)
**Status:** ✅ Provisioned (FFH-139)
**TLS:** Available (add `s` to protocol — `rediss://`)

### Connection

The production Redis URL is stored in:

- `apps/api/.env.production` under `REDIS_URL` (gitignored — never committed)
- Uses `redis://` protocol (TLS available as `rediss://`)

### Verified

```
PING → PONG ✅
```

---

## 1. Key Lifecycles & TTLs

Transient keys are kept in-memory for active rooms.

- **TTL Strategy:** Active rooms and related structures are initialized when the host creates a room. They have a default time-to-live (TTL) of **24 hours** from last activity to prevent memory leaks in case of abandoned lobbies.
- **Post-Game Persistence:** Upon finishing a game, the final rankings and round answers are persisted to PostgreSQL, and the corresponding Redis keys are explicitly deleted or expired within **5 minutes**.

---

## 2. Key Space Definitions

All keys are prefixed with `room:{roomCode}` where `{roomCode}` is the unique 6-digit uppercase alphanumeric room join code (e.g. `K8L2QX`).

### 2.1. Room Configuration & Metadata

- **Key:** `room:{roomCode}:meta`
- **Data Structure:** `Hash`
- **Description:** Stores the current configuration, status, and active identifiers of the game room.

| Field               | Type            | Example                | Description                                           |
| :------------------ | :-------------- | :--------------------- | :---------------------------------------------------- |
| `id`                | `string (UUID)` | `e8b5d5d8-...`         | PostgreSQL Room ID                                    |
| `hostId`            | `string (UUID)` | `a3f01c22-...`         | User ID of the host                                   |
| `status`            | `string`        | `LOBBY`                | LOBBY \| IN_PROGRESS \| FINISHED                      |
| `gameId`            | `string (UUID)` | `c4b1d7d8-...`         | Active Game Template ID (once started)                |
| `totalRounds`       | `number`        | `10`                   | Total number of rounds in the selected game           |
| `currentRoundIndex` | `number`        | `2`                    | 0-based index of the active round                     |
| `currentRoundId`    | `string (UUID)` | `f9a2b3c4-...`         | Active Round ID in PostgreSQL                         |
| `currentQuestionId` | `string (UUID)` | `d8a2b3c4-...`         | Active Question ID                                    |
| `timerDuration`     | `number`        | `20`                   | Total seconds allowed for the current question        |
| `timerRemaining`    | `number`        | `15`                   | Seconds remaining for the current question            |
| `questionStartedAt` | `string (ISO)`  | `2026-07-07T06:30:00Z` | Start timestamp (used for response time verification) |

---

### 2.2. Connected Players List

- **Key:** `room:{roomCode}:players`
- **Data Structure:** `Hash`
- **Description:** A map of all participants who have joined the room. The fields are Player IDs, and values are JSON serialized representations of player info.

| Field (Key)  | Value (JSON)                                                                 | Description                                                 |
| :----------- | :--------------------------------------------------------------------------- | :---------------------------------------------------------- |
| `{playerId}` | `{"id": string, "displayName": string, "score": number, "isReady": boolean}` | Player profile details, ready status, and cumulative score. |

---

### 2.3. Active Leaderboard

- **Key:** `room:{roomCode}:leaderboard`
- **Data Structure:** `Sorted Set (ZSET)`
- **Description:** Used to perform fast, real-time leaderboard queries and rank operations.
- **Score:** The player's cumulative `score` (integer).
- **Member:** `{playerId}`.

---

### 2.4. Submitted Answers

- **Key:** `room:{roomCode}:answers:{roundId}`
- **Data Structure:** `Hash`
- **Description:** Keeps track of answers submitted by players for the current round. Flushed to PostgreSQL and deleted when the round/game ends.

| Field (Key)  | Value (JSON)                                                           | Description                                   |
| :----------- | :--------------------------------------------------------------------- | :-------------------------------------------- |
| `{playerId}` | `{"answerText": string, "responseTime": number, "isCorrect": boolean}` | The submitted answer details for score audit. |

---

## 3. Atomic Operations & Concurrency

To ensure no race conditions occur (e.g. two players joining simultaneously, submitting answers right at the timer tick):

- **Player Joins:** Handled using `HSETNX` or transactional block to ensure unique Player display names within the room scope.
- **Answer Submission:** Verified against the `questionStartedAt` and `timerDuration` fields of `room:{roomCode}:meta`. Submissions after the timer expires are rejected.

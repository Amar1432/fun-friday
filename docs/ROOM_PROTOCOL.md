# Multiplayer Protocol & WebSocket Events

This document defines the strict contract for real-time WebSocket communication over Socket.IO. It dictates the payload structure for every real-time event. This ensures the Next.js frontend and the Node.js game server communicate perfectly.

## 1. Core Architectural Rules
* **No REST for Gameplay:** Standard HTTP requests are strictly forbidden for in-game actions. 
* **State Manager (Redis):** Live room interactions, rapid state changes, and timer synchronizations run entirely through Redis.
* **Latency Targets:** Moving between questions must take < 500ms.

## 2. Connection & Reconnect Logic
WebSocket reconnect logic and state synchronization are always the biggest points of failure. We handle this via explicit state syncing.

* **`connection` / `disconnect`**: Standard Socket.IO connection handlers.
* **Client Reconnect (`ReconnectRequest`)**:
  * **Payload:** `{ playerId: string, roomId: string }`
  * **Behavior:** If a player drops due to network failure, the client emits this upon socket reconnection. The server fetches the current Redis state and pushes a `StateSync` event to instantly restore the user's UI.

## 3. Client-to-Server Events (Emitted by Frontend)
These are actions initiated by Hosts or Players and sent to the NestJS Gateway.

### Room Management
* **`JoinRoom`**: `{ roomCode: string, displayName: string, guestToken: string }`
* **`LeaveRoom`**: `{ roomId: string, playerId: string }`
* **`PlayerReady`**: `{ roomId: string, playerId: string }`

### Game Loop (Host Only)
* **`StartGame`**: `{ roomId: string, gameId: string }`
* **`NextRound`**: `{ roomId: string }`
* **`EndGame`**: `{ roomId: string }`

### Gameplay (Players)
* **`SubmitAnswer`**: `{ roomId: string, questionId: string, answer: string, responseTimeMs: number }`

## 4. Server-to-Client Events (Broadcast by Backend)
These events are emitted by the Node.js server and consumed by the Next.js React components.

### Lobby Updates
* **`PlayerJoined`**: `{ player: { id: string, displayName: string, score: number, isReady: boolean } }`
* **`PlayerLeft`**: `{ playerId: string }`
* **`RoomStateUpdated`**: `{ players: Array, status: 'LOBBY' | 'IN_PROGRESS' }`

### Gameplay Loop
* **`GameStarted`**: `{ gameId: string, totalRounds: number }`
* **`QuestionStarted`**: `{ questionId: string, prompt: string, timeLimitSeconds: number, difficulty: string }`
* **`TimerTick`**: `{ secondsRemaining: number }` *(Synchronized every 1s from the Redis game loop engine).*
* **`AnswerReveal`**: `{ correctAnswer: string, explanations?: object }`
* **`LeaderboardUpdated`**: `[{ rank: number, playerId: string, displayName: string, score: number, streak: number }]`
* **`GameFinished`**: `{ finalRankings: Array }`
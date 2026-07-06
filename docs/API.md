# API.md

# Fun Friday Hub REST API Contract

**Version:** v1  
**Protocol:** REST over HTTPS  
**Base URL:**

```
/api/v1
```

---

# API Design Principles

## Responsibilities of REST API

The REST API is responsible only for:

- Authentication
- Room creation & validation
- Guest registration
- Game catalog
- Question loading
- Host dashboard data

## Responsibilities of Socket.IO

The following operations **MUST NOT** have REST endpoints.

- Join live room
- Player ready
- Start game
- Start round
- Countdown timer
- Submit answer
- Reveal answer
- Live leaderboard
- Score updates
- Next round
- End game
- Reconnection
- Presence updates
- Typing indicators
- Heartbeats

All real-time gameplay occurs through Socket.IO backed by Redis.

---

# Authentication

## Host Authentication

Hosts authenticate using their corporate identity provider.

Authentication flow is intentionally provider-agnostic (Google, Microsoft Azure AD, Okta, etc.).

Backend issues its own JWT after successful SSO.

---

## Guest Authentication

Guests do **not** have permanent accounts.

They receive a temporary JWT scoped only to a specific room.

---

# Common Headers

## JSON Requests

```http
Content-Type: application/json
Accept: application/json
```

---

## Authenticated Host Requests

```http
Authorization: Bearer <host_access_token>
```

---

## Authenticated Guest Requests

```http
Authorization: Bearer <guest_access_token>
```

---

# Standard Response Envelope

## Success

```json
{
  "success": true,
  "data": {}
}
```

---

## Error

```json
{
  "success": false,
  "error": {
    "code": "ROOM_NOT_FOUND",
    "message": "Room does not exist."
  }
}
```

---

# HTTP Status Codes

| Status | Meaning               |
| ------ | --------------------- |
| 200    | OK                    |
| 201    | Created               |
| 204    | No Content            |
| 400    | Validation Error      |
| 401    | Unauthorized          |
| 403    | Forbidden             |
| 404    | Not Found             |
| 409    | Conflict              |
| 422    | Unprocessable Entity  |
| 429    | Too Many Requests     |
| 500    | Internal Server Error |

---

# Authentication

---

# POST /auth/sso/login

Authenticate host using SSO provider.

Returns application JWT.

## Request

```json
{
  "provider": "google",
  "idToken": "eyJhbGciOi..."
}
```

---

## Response (200)

```json
{
  "success": true,
  "data": {
    "accessToken": "jwt_token",
    "expiresIn": 3600,
    "user": {
      "id": "usr_123",
      "name": "John Doe",
      "email": "john@company.com"
    }
  }
}
```

---

## Errors

| Status | Reason            |
| ------ | ----------------- |
| 401    | Invalid SSO token |
| 400    | Missing idToken   |

---

# POST /auth/guest

Creates a temporary guest identity.

Returns guest JWT.

---

## Request

```json
{
  "roomCode": "AB12CD",
  "displayName": "Alex"
}
```

---

## Response (201)

```json
{
  "success": true,
  "data": {
    "player": {
      "id": "player_uuid",
      "displayName": "Alex"
    },
    "room": {
      "id": "room_uuid",
      "code": "AB12CD"
    },
    "accessToken": "guest_jwt",
    "expiresIn": 14400
  }
}
```

---

## Errors

| Status | Reason                              |
| ------ | ----------------------------------- |
| 404    | Room not found                      |
| 409    | Display name already exists         |
| 422    | Room is no longer accepting players |

---

# POST /auth/logout

Invalidates current JWT (if token blacklist is implemented).

---

## Request

No body.

---

## Response (204)

No content.

---

# Room Management

---

# POST /rooms

Creates a new room.

Host only.

---

## Headers

```
Authorization: Bearer <host_token>
```

---

## Request

```json
{}
```

---

## Response (201)

```json
{
  "success": true,
  "data": {
    "room": {
      "id": "room_uuid",
      "code": "K8L2QX",
      "status": "LOBBY",
      "createdAt": "2026-07-05T09:30:00Z"
    }
  }
}
```

---

## Errors

| Status | Reason       |
| ------ | ------------ |
| 401    | Unauthorized |

---

# GET /rooms

Returns all rooms created by current host.

---

## Headers

```
Authorization: Bearer <host_token>
```

---

## Response (200)

```json
{
  "success": true,
  "data": [
    {
      "id": "room_uuid",
      "code": "K8L2QX",
      "status": "LOBBY",
      "createdAt": "2026-07-05T09:30:00Z",
      "playerCount": 17
    }
  ]
}
```

---

# GET /rooms/:id

Returns room details.

Host only.

---

## Response

```json
{
  "success": true,
  "data": {
    "id": "room_uuid",
    "code": "K8L2QX",
    "status": "LOBBY",
    "hostId": "usr_123",
    "players": [
      {
        "id": "player_uuid",
        "displayName": "Alex",
        "score": 0
      }
    ]
  }
}
```

---

# DELETE /rooms/:id

Deletes room.

Allowed only while room status is LOBBY.

---

## Response

```
204 No Content
```

---

# GET /rooms/validate/:code

Validates room code before guest login.

No authentication required.

---

## Response (200)

```json
{
  "success": true,
  "data": {
    "exists": true,
    "room": {
      "id": "room_uuid",
      "code": "K8L2QX",
      "status": "LOBBY"
    }
  }
}
```

---

## Response (404)

```json
{
  "success": false,
  "error": {
    "code": "ROOM_NOT_FOUND",
    "message": "Room does not exist."
  }
}
```

---

# Game Catalog

---

# GET /games

Returns all available game templates.

---

## Response

```json
{
  "success": true,
  "data": [
    {
      "id": "game_uuid",
      "name": "Emoji Guess",
      "description": "Guess the movie from emojis"
    },
    {
      "id": "game_uuid",
      "name": "Gibberish",
      "description": "Decode funny sounding words"
    }
  ]
}
```

---

# GET /games/:id

Returns complete information for one game.

---

## Response

```json
{
  "success": true,
  "data": {
    "id": "game_uuid",
    "name": "Emoji Guess",
    "description": "Guess movies using emojis",
    "questionCount": 240
  }
}
```

---

# Question Bank

These endpoints are used before the game starts.

Backend loads the returned questions into Redis.

No gameplay interaction should use REST afterwards.

---

# GET /games/:id/questions

Returns a filtered question set.

---

## Query Parameters

| Parameter  | Type                   | Required |
| ---------- | ---------------------- | -------- |
| limit      | number                 | No       |
| difficulty | EASY \| MEDIUM \| HARD | No       |
| category   | string                 | No       |
| random     | boolean                | No       |

---

## Example

```
GET /games/123/questions?difficulty=MEDIUM&limit=20&random=true
```

---

## Response

```json
{
  "success": true,
  "data": [
    {
      "id": "question_uuid",
      "difficulty": "MEDIUM",
      "category": "Movies",
      "prompt": "🎩⚡👦",
      "metadata": {
        "hint": "Wizard"
      }
    }
  ]
}
```

> **Note:** The correct answer is intentionally omitted from this endpoint to prevent accidental exposure to clients. The backend should retrieve and retain the full question (including the answer) when preparing the game state in Redis.

---

# Host Dashboard

---

# GET /me

Returns current authenticated host.

---

## Response

```json
{
  "success": true,
  "data": {
    "id": "usr_123",
    "name": "John Doe",
    "email": "john@company.com"
  }
}
```

---

# GET /me/rooms

Returns rooms created by authenticated host.

---

## Response

```json
{
  "success": true,
  "data": [
    {
      "id": "room_uuid",
      "code": "K8L2QX",
      "status": "LOBBY",
      "createdAt": "2026-07-05T09:30:00Z"
    }
  ]
}
```

---

# Resource Models

## User

```json
{
  "id": "usr_123",
  "email": "john@company.com",
  "name": "John Doe",
  "createdAt": "2026-07-05T09:30:00Z"
}
```

---

## Room

```json
{
  "id": "room_uuid",
  "code": "K8L2QX",
  "status": "LOBBY",
  "hostId": "usr_123",
  "createdAt": "2026-07-05T09:30:00Z",
  "updatedAt": "2026-07-05T09:30:00Z"
}
```

---

## Player

```json
{
  "id": "player_uuid",
  "displayName": "Alex",
  "score": 0,
  "joinedAt": "2026-07-05T09:40:00Z"
}
```

---

## Game

```json
{
  "id": "game_uuid",
  "name": "Emoji Guess",
  "description": "Guess the movie from emojis"
}
```

---

## Question

```json
{
  "id": "question_uuid",
  "difficulty": "MEDIUM",
  "category": "Movies",
  "prompt": "🎩⚡👦",
  "metadata": {
    "hint": "Wizard"
  }
}
```

---

# Enumerations

## RoomStatus

```text
LOBBY
IN_PROGRESS
FINISHED
```

---

## QuestionDifficulty

```text
EASY
MEDIUM
HARD
```

---

# REST API Summary

| Method | Endpoint              | Authentication |
| ------ | --------------------- | -------------- |
| POST   | /auth/sso/login       | No             |
| POST   | /auth/guest           | No             |
| POST   | /auth/logout          | JWT            |
| GET    | /me                   | Host JWT       |
| GET    | /me/rooms             | Host JWT       |
| POST   | /rooms                | Host JWT       |
| GET    | /rooms                | Host JWT       |
| GET    | /rooms/:id            | Host JWT       |
| DELETE | /rooms/:id            | Host JWT       |
| GET    | /rooms/validate/:code | No             |
| GET    | /games                | Optional       |
| GET    | /games/:id            | Optional       |
| GET    | /games/:id/questions  | Host JWT       |

---

# Explicitly Excluded from REST

The following actions are handled exclusively over Socket.IO and **must never** be exposed as REST endpoints:

- Join active room
- Leave room
- Player reconnect
- Presence updates
- Ready state
- Start game
- Pause game
- Resume game
- End game
- Start round
- Next round
- Countdown timer
- Submit answer
- Validate answer
- Score calculation
- Live leaderboard updates
- Reveal correct answer
- Buzzers
- Voting
- Polls
- Emoji reactions
- Heartbeats
- Redis synchronization

```

```

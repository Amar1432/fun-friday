# Database Architecture

This document defines the persistent storage layer for the Fun Friday Hub. It uses PostgreSQL and Prisma ORM.

**Note on State:** This database is strictly for long-term persistence (User profiles, Game templates, Historical analytics). All rapid, in-game state changes (active timers, live scoreboards) are handled in-memory via Redis.

## Production Database

**Provider:** [Neon](https://neon.tech) — Serverless PostgreSQL
**Status:** ✅ Provisioned (FFH-138)
**SSL:** Enabled (required by connection string)

### Connection

The production connection string is stored in:

- `apps/api/.env.production` (gitignored — never committed)
- Only needs the `DATABASE_URL` variable

### Setup Commands (for reference)

```bash
# Deploy migrations to production
dotenv -e apps/api/.env.production -- npx prisma migrate deploy

# Seed games into production
dotenv -e apps/api/.env.production -- npx tsx scripts/seed-games.ts
```

### Seeded Data

| Game                  | Questions |
| --------------------- | --------- |
| Emoji Guess           | 43        |
| Bad Movie Description | 43        |
| Gibberish             | 40        |

---

## Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// -----------------------------------------------------------------------------
// ENUMS
// -----------------------------------------------------------------------------

enum RoomStatus {
  LOBBY
  IN_PROGRESS
  FINISHED
}

enum QuestionDifficulty {
  EASY
  MEDIUM
  HARD
}

// -----------------------------------------------------------------------------
// MODELS
// -----------------------------------------------------------------------------

/// The authenticated host organizing the sessions.
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  rooms     Room[]
}

/// A specific game session created by a Host.
model Room {
  id        String     @id @default(uuid())
  code      String     @unique /// 6-digit alphanumeric join code
  hostId    String
  status    RoomStatus @default(LOBBY)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  host      User       @relation(fields: [hostId], references: [id], onDelete: Cascade)
  players   Player[]
  rounds    Round[]
}

/// Participants in a room (does not require a permanent User account).
model Player {
  id          String   @id @default(uuid())
  roomId      String
  displayName String
  score       Int      @default(0)
  joinedAt    DateTime @default(now())

  room        Room     @relation(fields: [roomId], references: [id], onDelete: Cascade)
  answers     Answer[]
}

/// Game templates (e.g., "Emoji Guess", "Gibberish").
model Game {
  id          String     @id @default(uuid())
  name        String
  description String?
  createdAt   DateTime   @default(now())

  questions   Question[]
}

/// Reusable questions belonging to a specific Game template.
model Question {
  id         String             @id @default(uuid())
  gameId     String
  difficulty QuestionDifficulty @default(MEDIUM)
  category   String?
  prompt     String             /// The question or clue
  answer     String             /// The correct answer
  metadata   Json?              /// Optional hints, explanations, or tags

  game       Game               @relation(fields: [gameId], references: [id], onDelete: Cascade)
  rounds     Round[]
}

/// A specific question being asked during an active Room session.
model Round {
  id         String    @id @default(uuid())
  roomId     String
  questionId String
  startedAt  DateTime  @default(now())
  endedAt    DateTime?

  room       Room      @relation(fields: [roomId], references: [id], onDelete: Cascade)
  question   Question  @relation(fields: [questionId], references: [id], onDelete: Cascade)
  answers    Answer[]
}

/// A player's submitted answer for a specific round. Flushed from Redis to Postgres post-game.
model Answer {
  id           String   @id @default(uuid())
  roundId      String
  playerId     String
  answerText   String   /// What the player typed/submitted
  responseTime Int      /// Milliseconds taken to answer
  isCorrect    Boolean

  round        Round    @relation(fields: [roundId], references: [id], onDelete: Cascade)
  player       Player   @relation(fields: [playerId], references: [id], onDelete: Cascade)
}
```

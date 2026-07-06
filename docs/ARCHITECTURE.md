# Fun Friday Hub: System Architecture

This document serves as the single source of truth for the frontend structure, backend contracts, and database architecture. Fun Friday Hub is a multiplayer platform for hosting interactive team games in virtual meetings, aiming to be the "Kahoot for corporate team building".

## 1. High-Level System Design

The architecture is split into stateless client serving and a stateful real-time game engine to handle persistent connections and rapid state changes.

| Component              | Technology Stack                                    | Core Responsibility                                                                                               | Hosting Target     |
| :--------------------- | :-------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------- | :----------------- |
| **Frontend**           | Next.js App Router, React, TypeScript, Tailwind CSS | Handles authentication, static pages, dashboard UI, and client routing.                                           | Vercel.            |
| **Game Server**        | NestJS, Node.js, Socket.IO                          | Long-running stateful server that handles the actual game loop, timers, and live scores.                          | Railway or Render. |
| **Ephemeral State**    | Redis                                               | In-memory datastore processing active rooms, live leaderboards, and incoming answers for ultra-fast reads/writes. | Railway or Render. |
| **Persistent Storage** | PostgreSQL, Prisma                                  | Long-term storage saving user profiles, game templates, reusable questions, and final post-game analytics.        | Supabase or Neon.  |

## 2. Monorepo Workspace Strategy

The project relies on a lean pnpm@10 workspace architecture.

- **apps/web**: Contains the Next.js frontend client.
- **apps/api**: Contains the NestJS backend and Socket.IO real-time gateway.
- **packages/shared**: Houses shared logic such as Zod validation schemas and shared Socket.IO payload types.

## 3. Real-Time Data Flow

- **The Database Bottleneck**: Writing every submitted answer directly to PostgreSQL during a live 30-player game causes latency spikes and connection pooling issues.
- **The Redis Solution**: Live room interactions, rapid state changes, and timer synchronizations run entirely through Redis.
- **Post-Game Sync**: Upon the game finishing, the final session data is flushed from Redis and saved into PostgreSQL for historical access.

## 4. Performance & Reliability Targets

- **Action Latency**: Joining a room must execute in < 2 seconds.
- **Transition Latency**: Moving between questions must take < 500ms.
- **Infrastructure Availability**: The MVP requires 99% uptime for the hosted version.
- **Security Posture**: All traffic over HTTPS, secure room codes, input validation, and strict rate limiting.

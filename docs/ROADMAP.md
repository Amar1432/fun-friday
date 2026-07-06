# Engineering Roadmap

## Sprint 1: MVP Scaffolding & Infrastructure

- Setup pnpm@10 monorepo (apps/web, apps/api, packages/shared).
- Configure Next.js frontend and NestJS backend.
- Establish Prisma database connections to PostgreSQL.
- Build authentication layouts (Google/Microsoft SSO).

## Sprint 2: Core Game Loop (Real-Time Engine)

- Implement Redis room state management.
- Map Socket.IO gateways for Player Join/Leave/Ready.
- Build Timer synchronization.
- Implement scoring calculation logic.

## Sprint 3: Polish & Deploy

- Finalize MVP games (Emoji Guess, Bad Movie Description, Gibberish).
- Responsive UI fixes for mobile players.
- Production deployment to Vercel (Frontend) and Railway/Render (Backend).

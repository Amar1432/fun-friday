# AI Single Source of Truth

You are an AI coding agent working on the **Fun Friday Hub** monorepo. Read this document carefully before executing any tasks.

## 1. Project Workflow

- **Do NOT ideate or guess:** Your job is to read the active instructions and execute them.
- **Focus:** You must only work on the ticket defined in `docs/ACTIVE_TASK.md`. Do not touch unrelated files.
- **State Logging:** Before you finish any session, you **must** update `docs/HANDOFF.md` with what changed, why it changed, and what is next.

## 2. Reading Order

Always read the documentation in this exact order before beginning a task:

1. `docs/PRD.md`
2. `docs/ARCHITECTURE.md`
3. `docs/DATABASE.md`
4. `docs/API.md`
5. `docs/ROOM_PROTOCOL.md`
6. `docs/ACTIVE_TASK.md`
7. `docs/HANDOFF.md`
8. `docs/DECISIONS.md`

## 3. Architecture & Coding Conventions

- **Frontend (`apps/web`):** Use Next.js App Router, React functional components, TypeScript, and Tailwind CSS.
- **Backend (`apps/api`):** Use NestJS, Node.js, and strictly route real-time pathways through Socket.IO.
- **Database (`packages/shared` / `apps/api`):** Always route persistent modifications via Prisma client profiles pointing to PostgreSQL. Use Redis strictly for ephemeral state (live rooms, timers).
- **Testing:** Keep tests close to the code inside `apps/web` and `apps/api` rather than a top-level directory.

## 4. Git Rules

- Commit code after every successful micro-feature.
- Ensure commit messages reference the ticket number (e.g., "feat(api): [FFH-001] Scaffold NestJS").

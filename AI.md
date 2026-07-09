# AI Single Source of Truth

You are an AI coding agent working on the **Fun Friday Hub** monorepo. Read this document carefully before executing any tasks.

## 1. Project Workflow

- **Do NOT ideate or guess:** Your job is to read the active instructions and execute them.
- **Focus:** You must only work on the ticket defined in `docs/ACTIVE_TASK.md`. Do not touch unrelated files.
- **State Logging:** Before you finish any session, you **must** update `docs/HANDOFF.md` with what changed, why it changed, and what is next.

## 2. Environment & Startup

- **Monorepo Execution:** This is a pnpm workspace. To start the entire stack (Next.js frontend and NestJS backend) simultaneously, ALWAYS run `pnpm dev` from the root directory. Do not attempt to start the applications separately or guess framework-specific commands.

## 3. Reading Order

Always read the documentation in this exact order before beginning a task. Do not read older or archived files unless explicitly told to.

1. `docs/ACTIVE_TASK.md`
2. `docs/HANDOFF.md`
3. `docs/TASKS.md`
4. `docs/ARCHITECTURE.md`
5. `docs/ROOM_PROTOCOL.md`

## 4. Architecture & Coding Conventions

- **Frontend (`apps/web`):** Next.js App Router, React functional components, TypeScript, and Tailwind CSS.
- **Backend (`apps/api`):** NestJS, Node.js, and strictly route real-time pathways through Socket.IO.
- **Database:** Always route persistent modifications via Prisma client pointing to PostgreSQL. Use Redis strictly for ephemeral state (live rooms, timers).
- **Testing:** Keep tests close to the code inside `apps/web` and `apps/api`.

## 5. Git & Execution Rules

- Actively utilize your terminal and CLI execution skills to build, test, and verify your work.
- Commit code after every successful micro-feature. Ensure commit messages reference the ticket number (e.g., "feat(api): [FFH-103] Add Shadcn").

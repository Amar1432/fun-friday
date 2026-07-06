# Active Task

**Ticket:** FFH-002
**Title:** Configure Monorepo Directory Structure
**Status:** COMPLETED

## Objective
Create the standard project folder layout for our `pnpm` monorepo. The `apps/web` and `apps/api` directories were successfully scaffolded in the previous step. Your goal now is to set up the remaining structural directories, specifically the shared workspace packages.

## Execution Requirements
1. **Verify Root Directories:** Ensure `apps/`, `packages/`, `prisma/`, `docs/`, and `scripts/` exist at the root level.
2. **Scaffold Packages:** Inside the `packages/` directory, create the following empty subdirectories:
   - `config`
   - `types`
   - `ui`
   - `eslint-config`
   - `tsconfig`
3. **No Dummy Code:** Do not create placeholder files or dummy code inside these new directories. Your task is strictly to establish the directory structure.

## Completion
Once the directory tree matches the acceptance criteria, update `docs/HANDOFF.md` with your status and close the session.
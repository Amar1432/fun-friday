# Active Task

**Ticket:** FFH-004
**Title:** Configure Shared ESLint
**Status:** COMPLETED

## Objective
Implement a reusable ESLint configuration package that enforces consistent linting rules across the entire monorepo.

## Execution Requirements
1. **Package Setup:** Create a new package `packages/eslint-config`.
2. **Configuration:** Define a base ESLint configuration here that sets the standard for both React (Next.js) and Node.js (NestJS) environments.
3. **Integration:** Update `apps/web` and `apps/api` to extend this shared package.
4. **Validation:** Ensure the root `pnpm lint` command correctly triggers linting for all workspace apps and reports no errors on the current scaffolded state.

## Completion
Once the shared configuration is integrated and `pnpm lint` runs successfully across the monorepo, update `docs/HANDOFF.md` with your status and close the session.
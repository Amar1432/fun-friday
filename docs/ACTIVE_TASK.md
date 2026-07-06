# Active Task

**Ticket:** FFH-006
**Title:** Configure Git Hooks

## Objective

Prevent commits that break code standards by verifying type checking, linting, and formatting on pre-commit hooks.

## Execution Requirements

1. **Tool Setup:** Install and configure husky and/or lint-staged (or another light pre-commit hook framework) in the monorepo root.
2. **Pre-commit Script:** Add a pre-commit hook that runs the linter (`pnpm lint`) and formatting check (`pnpm format`).
3. **Commit Guard:** Ensure the commit is blocked if linting or formatting checks fail.
4. **Verification:** Verify that formatting is run and checked on files staged for commit.

## Completion

Once the git hooks are configured and successfully run before commits, update `docs/HANDOFF.md` with your status and close the session.

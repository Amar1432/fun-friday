# Command CMD Session

Read `AI.md` for coding conventions.
Then, strictly read these files in order:

1. docs/HANDOFF.md
2. docs/ACTIVE_TASK.md
3. docs/TASKS.md
4. docs/ARCHITECTURE.md

### Task Overview

Target Ticket: <TICKET_ID>

### Tool & Skill Execution Protocol

- **Invoke Your Skills:** You are equipped with `skills.sh` capabilities. You MUST actively invoke the appropriate installed skills (e.g., `frontend-design`, formatting, or architecture tools) to analyze, write, and verify your code for this ticket.
- **CLI Verification:** Do not guess if the code works. Use your terminal skills to run `pnpm build`, `pnpm lint`, and `pnpm test`. If an error occurs, use your skills to read the logs and fix it.

### Completion & Git Handoff

Before ending this session, you MUST execute the following terminal commands in exact order:

1. Stage changes: `git add .`
2. Commit changes: `git commit -m "feat: complete <TICKET_ID>"`
3. Update `docs/HANDOFF.md` with the session results.
4. Update `docs/ACTIVE_TASK.md` to reflect the next logical step.

Keep changes focused entirely on the assigned ticket. Do not refactor out-of-scope code.

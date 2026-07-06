# Active Task

**Ticket:** FFH-001
**Title:** Initialize pnpm Workspace
**Status:** COMPLETED

## Objective
Use your local CLI capabilities to bootstrap the foundation of the monorepo. You need to generate the Next.js frontend and NestJS backend within their respective directories.

## Execution Requirements
1. **Frontend (`apps/web`):** Run the standard `create-next-app` command to scaffold a Next.js App Router project using TypeScript and Tailwind CSS. Ensure it builds successfully.
2. **Backend (`apps/api`):** Run the `nest new` command to scaffold the NestJS application. 
3. **Package Manager Constraints:** This is a `pnpm@10` workspace. You **must** ensure that NestJS does not generate a conflicting `package-lock.json` or `yarn.lock`. Pass the appropriate flags (e.g., `--package-manager pnpm`) to enforce this.
4. **Clean Up:** Do not create any unnecessary root-level storage or asset folders. Respect the existing `.gitignore` and `pnpm-workspace.yaml`.

## Completion
Once both applications compile without errors, update `docs/HANDOFF.md` with your status and close the session.
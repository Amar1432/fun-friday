# Deployment Guide

This document captures the production deployment strategy, environment variables, build commands, and lessons learned from provisioning Fun Friday Hub on Vercel + Railway.

---

## Infrastructure Overview

| Component                 | Host               | Details                                                                                 |
| ------------------------- | ------------------ | --------------------------------------------------------------------------------------- |
| **Frontend (Next.js)**    | Vercel             | `fun-friday-tau.vercel.app`, monorepo app (`apps/web`), auto-deploys from `main` branch |
| **Backend (NestJS)**      | Railway            | `fun-friday-api.railway.app`, Dockerfile-based deploy from `apps/api/Dockerfile`        |
| **Database (PostgreSQL)** | Neon               | Serverless Postgres, `DATABASE_URL` with SSL                                            |
| **Cache (Redis)**         | Redis Cloud        | Ephemeral room/game state                                                               |
| **Auth**                  | Google + Microsoft | OAuth SSO only (mock auth fully removed)                                                |

---

## Environment Variables

### `apps/web` (frontend — Vercel)

Listed in `.env.example`; `NEXT_PUBLIC_*` values are exposed to the browser.

| Key                               | Description                           |
| --------------------------------- | ------------------------------------- |
| `NEXT_PUBLIC_API_URL`             | REST API base URL with versioned path |
| `NEXT_PUBLIC_AUTH_CALLBACK_URL`   | Post-auth redirect URL                |
| `NEXT_PUBLIC_APP_NAME`            | Displayed product name                |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID`    | Google OAuth client ID                |
| `NEXT_PUBLIC_MICROSOFT_CLIENT_ID` | Microsoft OAuth client ID             |
| `NEXT_PUBLIC_SOCKET_URL`          | Socket.IO connection URL              |

### `apps/api` (backend — Railway)

| Key                   | Description                          |
| --------------------- | ------------------------------------ |
| `NODE_ENV`            | `production`                         |
| `PORT`                | HTTP/Socket.IO port (default `3001`) |
| `DATABASE_URL`        | Neon PostgreSQL connection string    |
| `REDIS_URL`           | Redis Cloud connection string        |
| `JWT_SECRET`          | 32+ random bytes for token signing   |
| `JWT_EXPIRATION`      | Duration (e.g., `24h`)               |
| `GOOGLE_CLIENT_ID`    | Google OAuth client ID               |
| `MICROSOFT_CLIENT_ID` | Microsoft OAuth client ID            |
| `FRONTEND_ORIGIN`     | Absolute origin of deployed frontend |

Production secrets live in `apps/api/.env.production` (gitignored).

---

## Production Build & Start Commands

### Frontend

```
pnpm --filter web build    # Next.js production build
```

Generated output: `apps/web/.next`

### Backend

```
pnpm --filter api build    # TypeScript → dist/
node apps/api/dist/main.js # NestJS production start
```

The Dockerfile wraps both steps:

```
docker build -f apps/api/Dockerfile -t fun-friday-api .
```

---

## Lessons Learned / Gotchas

### 1. Vercel Next.js Detection in Monorepos

**Error:** `No Next.js version detected` during deployment.

**Cause:** Root Directory was `.` (repo root). Vercel's framework autodetection looks for `next` in the Root Directory's `package.json`. The repo root has no `next` dependency.

**Fix:** Set Vercel project Root Directory to `apps/web` where `next` lives.

**Note:** This must be done via the Vercel Dashboard or API (`PATCH /v9/projects/{id}` with `rootDirectory: "apps/web"`). CLI `vercel project update` does not expose this setting.

### 2. Deploy Triggers with `vercel deploy`

**Observation:** The CLI command `vercel deploy` from the repo root triggers a preview deployment that uses Git-pushed code, not the local working tree. Ensure all code is committed and pushed before triggering.

### 3. PNPM Workspace Install in Railway Docker

**Observation:** Setting `pnpm.onlyBuiltDependencies` in root `package.json` to include `@prisma/client`, `@prisma/engines`, and `prisma` is required in the Docker environment — pnpm's security filter skips native build scripts for these packages otherwise, and Prisma client will fail at runtime without its generated engine.

### 4. CORS Enforces Production Origins

**Guard:** `apps/api/src/config/cors.config.ts` validates `FRONTEND_ORIGIN` on startup — it must be an absolute HTTP(S) origin without a trailing slash. The app crashes intentionally if misconfigured.

### 5. Mock Auth Code Must Be Fully Purged

**Verification:** After removing mock login, grep all source files and `.env*`/`.json` for `mock_token`, `handleMockLogin`, `mockLogin`. Zero matches confirmed across the entire codebase.

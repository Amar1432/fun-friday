# syntax=docker/dockerfile:1

# ---- Base ----
FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# ---- Install (root workspace) ----
FROM base AS install
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/api/package.json ./apps/api/package.json
COPY prisma ./prisma
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# root postinstall already ran prisma generate above

# ---- Build ----
FROM install AS build
COPY . .
RUN pnpm --filter api build

# ---- Runtime ----
FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Runtime deps only
COPY --from=install /app/node_modules ./node_modules
COPY --from=install /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=install /app/packages ./packages
COPY --from=install /app/prisma ./prisma
COPY --from=build /app/apps/api/dist ./apps/api/dist

WORKDIR /app/apps/api
EXPOSE 3001
ENV PORT=3001
CMD ["node", "dist/main.js"]

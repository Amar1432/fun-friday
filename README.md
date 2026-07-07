# Fun Friday Hub 🚀

> A multiplayer platform for hosting interactive team games in virtual meetings. Designed to be the "Kahoot for corporate team building."

## 📖 Overview

Many organizations conduct weekly engagement activities, but the process usually involves manually preparing slides, tracking scores in chat, and reusing the same games. Fun Friday Hub solves this by providing a frictionless, real-time multiplayer web platform where anyone can host a game room in under one minute.

## 🛠 Tech Stack

This project operates as a highly optimized monorepo managed by `pnpm@10`.

- **Frontend (`apps/web`):** Next.js App Router, React, TypeScript, Tailwind CSS.
- **Backend (`apps/api`):** NestJS, Node.js, Socket.IO.
- **Database (`prisma/`):** PostgreSQL (Persistent Storage) & Redis (Ephemeral Game State).
- **Tooling:** ESLint, Prettier, Husky, Lint-Staged.

## 🚀 Quick Start (Local Development)

### 1. Prerequisites

- Node.js (v20+)
- `pnpm` (v10)
- PostgreSQL & Redis running locally (or via Docker)

### 2. Installation

Clone the repository and install all workspace dependencies:
\`\`\`bash
git clone https://github.com/yourusername/fun-friday-hub.git
cd fun-friday-hub
pnpm install
\`\`\`

### 3. Environment Configuration

Copy the environment templates and fill in your local database credentials:
\`\`\`bash
cp .env.example .env
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
\`\`\`

### 4. Database Setup

Push the Prisma schema to your local PostgreSQL instance and generate the client:
\`\`\`bash
pnpm --filter api prisma db push
pnpm --filter api prisma generate
\`\`\`

### 5. Running the Application

Start the development servers for both the frontend and backend simultaneously:
\`\`\`bash
pnpm dev
\`\`\`

- Frontend runs on: `http://localhost:3000`
- Backend API runs on: `http://localhost:3001`

## 🧠 Documentation & AI Architecture

This repository utilizes a "File-System-as-Brain" protocol for AI-assisted development.

- If you are an AI coding agent or a human developer looking to contribute, **you must read the documentation index located at `docs/README.md` before making any changes.**

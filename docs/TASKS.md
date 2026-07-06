# TASKS.md

# Fun Friday Hub — Sprint 1 (MVP Scaffolding & Infrastructure)

**Sprint Goal**

Establish the project foundation by creating a production-ready monorepo, configuring the frontend and backend applications, setting up the database layer, and implementing Host Authentication using Google/Microsoft SSO.

---

# Epic 1 — Monorepo Foundation

---

## FFH-001: Initialize pnpm Workspace

### Description

Create the root monorepo using pnpm v10.

### Acceptance Criteria

- pnpm workspace is initialized.
- Workspace configuration file exists.
- Root package.json is configured for workspaces.
- Node.js engine version is defined.
- Package manager is locked to pnpm v10.
- Repository installs successfully using a single `pnpm install`.
- No dependency resolution warnings exist.

---

## FFH-002: Configure Monorepo Directory Structure

### Description

Create the standard project folder layout.

### Acceptance Criteria

The repository contains:

```text
apps/
packages/
prisma/
docs/
scripts/
```

Inside apps:

```text
apps/web
apps/api
```

Inside packages:

```text
packages/config
packages/types
packages/ui
packages/eslint-config
packages/tsconfig
```

No placeholder code exists beyond scaffolding.

---

## FFH-003: Configure Shared TypeScript Settings

### Description

Create reusable TypeScript configurations.

### Acceptance Criteria

- Root TypeScript configuration exists.
- Shared tsconfig package exists.
- Frontend extends shared configuration.
- Backend extends shared configuration.
- Path aliases are supported.
- Strict mode is enabled.
- Incremental compilation is enabled.

---

## FFH-004: Configure Shared ESLint

### Description

Provide a reusable lint configuration.

### Acceptance Criteria

- Shared ESLint configuration package exists.
- Web uses shared configuration.
- API uses shared configuration.
- Root lint command executes successfully.
- No lint errors after fresh scaffold.

---

## FFH-005: Configure Prettier

### Description

Create project-wide formatting rules.

### Acceptance Criteria

- Root prettier configuration exists.
- Ignore file exists.
- Formatting command runs successfully.
- All scaffolded files are formatted.

---

## FFH-006: Configure Git Hooks

### Description

Prevent invalid commits.

### Acceptance Criteria

- Pre-commit hook exists.
- Lint executes before commit.
- Formatting check executes before commit.
- Commit is blocked when checks fail.

---

## FFH-007: Configure Environment Variable Strategy

### Description

Standardize environment configuration.

### Acceptance Criteria

Environment templates exist for:

- Root
- Frontend
- Backend

Variables are documented.

Sensitive values are excluded from version control.

---

# Epic 2 — Frontend Foundation

---

## FFH-008: Scaffold Next.js Application

### Description

Create the frontend application.

### Acceptance Criteria

- Next.js application exists under apps/web.
- TypeScript enabled.
- App Router enabled.
- Application starts successfully.
- Production build succeeds.

---

## FFH-009: Configure Tailwind CSS

### Description

Install and configure Tailwind.

### Acceptance Criteria

- Tailwind configured.
- Global styles configured.
- Development server renders Tailwind styles.
- Production build succeeds.

---

## FFH-010: Configure Shared UI Package

### Description

Prepare reusable UI package.

### Acceptance Criteria

- packages/ui exists.
- Frontend imports package successfully.
- Build succeeds.
- No circular dependencies.

---

## FFH-011: Configure Frontend Environment Variables

### Description

Connect frontend runtime configuration.

### Acceptance Criteria

Frontend can access:

- API URL
- Auth callback URL
- Public application name

Configuration loads correctly in development.

---

# Epic 3 — Backend Foundation

---

## FFH-012: Scaffold NestJS API

### Description

Create backend service.

### Acceptance Criteria

- NestJS application exists.
- TypeScript enabled.
- API starts successfully.
- Health endpoint responds successfully.

---

## FFH-013: Configure Global Validation

### Description

Enable request validation.

### Acceptance Criteria

- Global validation pipe enabled.
- Unknown fields rejected.
- Invalid payloads return validation errors.
- DTO validation enabled.

---

## FFH-014: Configure Global Exception Handling

### Description

Create consistent API error responses.

### Acceptance Criteria

- Global exception filter configured.
- Validation errors are standardized.
- Internal server errors return consistent format.
- Stack traces hidden in production.

---

## FFH-015: Configure API Logging

### Description

Add structured request logging.

### Acceptance Criteria

Logs include:

- Method
- URL
- Status
- Response time
- Request ID

Logging works in development.

---

## FFH-016: Configure CORS

### Description

Allow frontend communication.

### Acceptance Criteria

- Frontend origin configurable.
- Credentials supported.
- Invalid origins rejected.

---

# Epic 4 — Database Layer

---

## FFH-017: Configure Prisma

### Description

Initialize Prisma.

### Acceptance Criteria

- Prisma initialized.
- Schema directory configured.
- Prisma client generated.
- Generation succeeds.

---

## FFH-018: Configure PostgreSQL Connection

### Description

Connect Prisma to PostgreSQL.

### Acceptance Criteria

- Database URL configured.
- Connection verified.
- Startup succeeds.
- Connection errors handled gracefully.

---

## FFH-019: Create Initial Database Schema

### Description

Add project schema.

### Acceptance Criteria

Schema includes:

- User
- Room
- Player
- Game
- Question
- Round
- Answer

Relations match architecture documentation.

Schema validates successfully.

---

## FFH-020: Configure Prisma Migrations

### Description

Enable migration workflow.

### Acceptance Criteria

- Initial migration created.
- Migration executes successfully.
- Database tables created.
- Migration history stored.

---

## FFH-021: Configure Prisma Client Module

### Description

Integrate Prisma into NestJS.

### Acceptance Criteria

- Singleton Prisma service created.
- Graceful shutdown implemented.
- Dependency injection configured.
- Database accessible from modules.

---

# Epic 5 — Authentication

---

## FFH-022: Configure Authentication Module

### Description

Create authentication module.

### Acceptance Criteria

- Authentication module exists.
- Authentication service exists.
- Authentication controller exists.
- Module loads successfully.

---

## FFH-023: Configure JWT Infrastructure

### Description

Prepare application JWT support.

### Acceptance Criteria

- JWT secret configurable.
- Token expiration configurable.
- Signing service implemented.
- Verification service implemented.

---

## FFH-024: Configure Google OAuth Provider

### Description

Enable Google SSO.

### Acceptance Criteria

- Google provider configured.
- Callback endpoint exists.
- User profile parsed.
- Existing users identified correctly.
- New users created automatically.

---

## FFH-025: Configure Microsoft OAuth Provider

### Description

Enable Microsoft SSO.

### Acceptance Criteria

- Microsoft provider configured.
- Callback endpoint exists.
- User profile parsed.
- Existing users identified correctly.
- New users created automatically.

---

## FFH-026: Persist Host User

### Description

Store authenticated hosts.

### Acceptance Criteria

- User record created on first login.
- Existing user reused.
- Duplicate users prevented.
- Email uniqueness enforced.

---

## FFH-027: Issue Application JWT

### Description

Generate application access token.

### Acceptance Criteria

JWT contains:

- User ID
- Email
- Name

Expiration configured.

Signing verified.

---

## FFH-028: Protect Authenticated Endpoints

### Description

Create JWT guard.

### Acceptance Criteria

- Guard implemented.
- Invalid token rejected.
- Missing token rejected.
- Valid token accepted.

---

# Epic 6 — Frontend Authentication

---

## FFH-029: Build Login Screen

### Description

Create host login page.

### Acceptance Criteria

Page contains:

- Application branding
- Google sign-in button
- Microsoft sign-in button
- Loading state
- Error state

Responsive layout implemented.

---

## FFH-030: Implement Google Login Flow

### Description

Connect Google authentication.

### Acceptance Criteria

- Login button initiates authentication.
- Successful login redirects correctly.
- Failed login displays error.
- Loading state shown during authentication.

---

## FFH-031: Implement Microsoft Login Flow

### Description

Connect Microsoft authentication.

### Acceptance Criteria

- Login button initiates authentication.
- Successful login redirects correctly.
- Failed login displays error.
- Loading state shown during authentication.

---

## FFH-032: Store Authentication Session

### Description

Persist authenticated host session.

### Acceptance Criteria

- Access token stored securely.
- Session restored after refresh.
- Logout clears session.
- Unauthorized users redirected to login.

---

## FFH-033: Build Protected Dashboard Shell

### Description

Create authenticated landing page.

### Acceptance Criteria

Dashboard contains:

- Header
- User information
- Placeholder navigation
- Placeholder content area

Unauthenticated access is blocked.

---

# Epic 7 — Quality & CI

---

## FFH-034: Configure Testing Framework

### Description

Prepare testing infrastructure.

### Acceptance Criteria

- Frontend test runner configured.
- Backend test runner configured.
- Sample tests execute successfully.
- Coverage reporting enabled.

---

## FFH-035: Configure GitHub Actions

### Description

Create continuous integration pipeline.

### Acceptance Criteria

Pipeline performs:

- Install dependencies
- Type checking
- Linting
- Testing
- Production build

Pipeline completes successfully.

---

## FFH-036: Verify Full Project Build

### Description

Validate Sprint 1 deliverables.

### Acceptance Criteria

The following commands complete successfully:

- Install dependencies
- Generate Prisma client
- Run database migration
- Start backend
- Start frontend
- Run tests
- Run lint
- Run production build

No blocking errors remain.

---

# Sprint 1 Definition of Done

Sprint 1 is complete when:

- pnpm monorepo is fully operational.
- Next.js application runs successfully.
- NestJS application runs successfully.
- PostgreSQL connects through Prisma.
- Initial migration executes successfully.
- Google SSO login works.
- Microsoft SSO login works.
- Host receives application JWT.
- Protected routes function correctly.
- CI pipeline passes.
- Linting passes.
- Tests execute successfully.
- Production builds succeed for both applications.

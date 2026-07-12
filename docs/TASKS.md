# TASKS.md

_(Note: For completed Sprint 1 & 2 tasks, see `docs/archive/SPRINT_1_2_AND_3_TASKS.md`)_
_(Note: For completed Sprint 4, 5, & 6 tasks, see `docs/archive/SPRINT_4_5_6_TASKS.md`)_

# Sprint 7 — Production Deployment Strategy

**Sprint Goal**

Prepare Fun Friday Hub for its first production deployment by removing all development-only authentication, provisioning production cloud infrastructure, securing runtime configuration, and establishing a fully automated CI/CD pipeline.

---

# Epic 35 — Production Authentication

---

## FFH-136: Remove Mock Authentication Flow

### Description

Remove all mock authentication functionality from the frontend and backend so that only production authentication providers remain available.

### Acceptance Criteria

- All mock login buttons are removed from the HeroUI interface.
- All mock authentication routes are removed.
- All mock authentication services are removed.
- All mock authentication feature flags are removed.
- No production code references mock authentication.
- Application behavior remains unchanged for Google and Microsoft SSO users.
- Existing authentication tests are updated accordingly.

---

## FFH-137: Verify Production Authentication Providers

### Description

Validate the production authentication flow before deployment.

### Acceptance Criteria

The application supports only:

- Google SSO
- Microsoft SSO

Validation confirms:

- Successful login.
- Failed login handling.
- Logout.
- Session restoration.
- Token expiration handling.
- Unauthorized access redirection.

No mock authentication entry points remain.

---

# Epic 36 — Cloud Infrastructure

---

## FFH-138: Provision Production PostgreSQL Database

### Description

Provision the managed PostgreSQL production database.

### Acceptance Criteria

- Production database instance is created.
- Database credentials are generated.
- SSL connection is enabled.
- Connection string is documented.
- Access credentials are stored securely.
- Database is reachable from the backend.

---

## FFH-139: Provision Production Redis Instance

### Description

Provision the managed Redis instance for ephemeral game state.

### Acceptance Criteria

- Redis instance is created.
- Connection URL is generated.
- Authentication is enabled.
- TLS support is configured if available.
- Credentials are stored securely.
- Backend connectivity is verified.

---

## FFH-140: Provision Frontend Hosting Environment

### Description

Prepare the production frontend hosting platform.

### Acceptance Criteria

- Project is created.
- Production environment is configured.
- Build settings are verified.
- Framework is correctly detected.
- Environment variable support is available.

---

## FFH-141: Provision Backend Hosting Environment

### Description

Prepare the production backend hosting platform.

### Acceptance Criteria

- Service is created.
- Runtime environment is configured.
- Build settings are verified.
- Health endpoint is configured.
- Environment variable support is enabled.

---

# Epic 37 — Production Configuration

---

## FFH-142: Configure Frontend Production Environment Variables

### Description

Configure all frontend runtime variables.

### Acceptance Criteria

Environment includes only required public variables such as:

- API base URL.
- Public application URL.
- Google authentication configuration.
- Microsoft authentication configuration.

No secrets are exposed to the client.

---

## FFH-143: Configure Backend Production Environment Variables

### Description

Configure secure backend runtime configuration.

### Acceptance Criteria

Backend variables include:

- Database connection.
- Redis connection.
- JWT secret.
- JWT expiration.
- Google OAuth credentials.
- Microsoft OAuth credentials.
- CORS origin.
- Application environment.

Sensitive values are never committed to source control.

---

## FFH-144: Validate Production Secret Management

### Description

Ensure secrets are managed securely across all deployment platforms.

### Acceptance Criteria

- No secrets exist in the repository.
- No secrets exist in committed configuration files.
- Secrets are configured using hosting platform secret management.
- Local development configuration remains independent from production.

---

# Epic 38 — Deployment Pipeline

---

## FFH-145: Connect Repository to Frontend Deployment

### Description

Connect the Git repository to the frontend hosting platform.

### Acceptance Criteria

- Repository is linked.
- Production branch is configured.
- Automatic deployment is enabled.
- Preview deployments are enabled for pull requests if supported.
- Successful deployment is confirmed.

---

## FFH-146: Connect Repository to Backend Deployment

### Description

Connect the Git repository to the backend hosting platform.

### Acceptance Criteria

- Repository is linked.
- Production branch is configured.
- Automatic deployment is enabled.
- Build process completes successfully.
- Service starts successfully after deployment.

---

## FFH-147: Configure Automatic Production Deployments

### Description

Establish continuous deployment for the application.

### Acceptance Criteria

Every push to the `main` branch automatically:

- Builds the frontend.
- Deploys the frontend.
- Builds the backend.
- Deploys the backend.

Deployment failures are reported clearly.

---

## FFH-148: Verify Production Build Process

### Description

Validate the complete production build workflow.

### Acceptance Criteria

Production pipeline successfully:

- Installs dependencies.
- Generates Prisma client.
- Builds frontend.
- Builds backend.
- Produces optimized production artifacts.
- Completes without build warnings that block deployment.

---

# Epic 39 — Production Validation

---

## FFH-149: Execute Production Smoke Tests

### Description

Validate the deployed application using core user journeys.

### Acceptance Criteria

Smoke tests verify:

- Frontend loads successfully.
- Backend health endpoint responds.
- Google authentication works.
- Microsoft authentication works.
- Room creation succeeds.
- Guest joining succeeds.
- Socket connection succeeds.
- Gameplay starts successfully.
- Answer submission succeeds.
- Leaderboard updates correctly.

No critical production issues are identified.

---

## FFH-150: Perform Production Readiness Review

### Description

Confirm that the application satisfies the minimum requirements for a public MVP deployment.

### Acceptance Criteria

Review confirms:

- Production URLs are operational.
- HTTPS is enabled.
- Environment variables are configured correctly.
- Authentication works end-to-end.
- Database connectivity is stable.
- Redis connectivity is stable.
- Automatic deployments are operational.
- Mock authentication has been completely removed.
- Production documentation is updated to reflect the deployed architecture.

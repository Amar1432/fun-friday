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

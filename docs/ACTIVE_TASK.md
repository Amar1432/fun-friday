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

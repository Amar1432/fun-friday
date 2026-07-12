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

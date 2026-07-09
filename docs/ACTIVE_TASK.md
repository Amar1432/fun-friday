# Active Task

**Ticket:** FFH-104
**Title:** Implement Global 401 Auth Interceptor

## Objective

Handle expired host tokens gracefully by logging out the user instead of letting them stay stuck on restricted pages.

## Execution Requirements

1. **API Interceptor:** Add a response interceptor to the API client (`apps/web/lib/api.ts`) that catches any `401 Unauthorized` responses.
2. **State Cleanup:** Securely wipe the local auth state/token immediately upon detecting a 401.
3. **User Redirection:** Gracefully redirect the user back to `/login` with an informative toast notification explaining their session expired.

## Completion

Once the auth interceptor is implemented and verified, commit the changes, update `docs/HANDOFF.md`, and update this file to point to the next logical step.

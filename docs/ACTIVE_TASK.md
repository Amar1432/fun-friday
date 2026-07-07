# Active Task

## FFH-050: Validate Game Start Preconditions

### Description

Verify lobby requirements before gameplay begins.

### Acceptance Criteria

Validation includes:

- Host connected
- Minimum player count
- Required ready players
- Room status
- Valid game configuration

Failures return protocol-compliant error events.

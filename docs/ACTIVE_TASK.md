# Active Task

## FFH-060: Persist Completed Round Data

### Description

Flush completed round information to PostgreSQL.

### Acceptance Criteria

Persisted data includes:

- Player answers
- Correctness
- Response time
- Round reference

Redis remains authoritative until persistence completes successfully.

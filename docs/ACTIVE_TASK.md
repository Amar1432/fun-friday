# Active Task

**Ticket:** FFH-115
**Title:** Implement Answer Normalization

## Objective

Normalize incoming answers before evaluation. The normalizer should perform: lowercase conversion, trim whitespace, collapse multiple spaces, remove punctuation, ignore hyphens and underscores.

## Execution Requirements

1. **Normalization Logic:** Add a `normalize(input: string): string` method to the existing `AnswerEvaluationService` that transforms the input using all the specified rules.
2. **Update evaluate():** Update the `evaluate()` method to call `normalize()` on both input and target before comparing them.
3. **Verification:** Run backend tests (`pnpm test` in `apps/api`) to ensure all existing tests pass, and any new normalization tests (FFH-118) are green.

## Completion

Stage, commit, update `docs/HANDOFF.md`, and update this file to point to the next logical step (FFH-116).

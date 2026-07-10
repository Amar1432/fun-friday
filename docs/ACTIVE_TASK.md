# Active Task

**Ticket:** FFH-116
**Title:** Implement Minor Typo Tolerance

## Objective

Add Levenshtein-distance-based typo tolerance to the answer evaluation service, allowing answers with a single character error (missing, extra, transposed, or incorrect) to still match.

## Execution Requirements

1. **Typo Tolerance Logic:** Add a `calculateDistance(a: string, b: string): number` method to `AnswerEvaluationService` that computes the Levenshtein distance between two strings.
2. **Update evaluate():** Update `evaluate()` to accept an optional `threshold` parameter (default `0` for exact match after normalization). When `threshold > 0`, answers within that edit distance are accepted.
3. **Verification:** Run backend tests to ensure normalization still works and the new typo tolerance tests pass.

## Completion

Stage, commit, update `docs/HANDOFF.md`, and update this file to point to the next logical step (FFH-117).

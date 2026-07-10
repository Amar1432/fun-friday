# Active Task

**Ticket:** FFH-114
**Title:** Create Answer Evaluation Module

## Objective

Create a dedicated, standalone NestJS module in `apps/api` responsible for evaluating player answers independently of any specific game mode. This sets the foundation for the fuzzy-matching logic.

## Execution Requirements

1. **Module Creation:** Scaffold a new NestJS module (`AnswerEvaluationModule`) and a corresponding service (`AnswerEvaluationService`) within the backend.
2. **Isolation:** Ensure this service is isolated from Socket.IO handlers. It should expose a public interface (e.g., an `evaluate(input, target)` method) that simply returns a boolean for now (we will add fuzzy matching in the next ticket).
3. **Integration:** Inject this new service into your existing game loop/answer submission handler. Replace any existing hardcoded `===` equality checks with a call to this new service.
4. **Verification:** Start the stack (`pnpm dev`) and run your backend tests (`pnpm test` in `apps/api`) to ensure the module is injected correctly and existing tests still pass.

## Completion

Stage, commit, update `docs/HANDOFF.md`, and update this file to point to the next logical step (FFH-115).

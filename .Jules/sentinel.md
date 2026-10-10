## 2026-10-10 - Synchronizing Mock Data with Frontend Definitions
**Learning:** When making updates to game definitions that are mirrored between the backend and frontend (like question counts), always ensure that associated snapshot tests and mock data in the frontend are updated accordingly to avoid artificial CI failures.
**Action:** Updated text assertions in `apps/web/components/game-selection-card.spec.tsx` and `apps/web/app/room/create/page.spec.tsx` to reflect the newly updated 43 questions for Emoji Guess and Bad Movie Description.

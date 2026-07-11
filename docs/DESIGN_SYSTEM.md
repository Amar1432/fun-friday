# Fun Friday Hub Design System

This document defines the lightweight UI system for `apps/web`. It is intentionally small: use it to keep screens consistent while the product is still moving quickly.

## Principles

- Build with semantic tokens first, then component classes.
- Prefer HeroUI primitives for complex accessible controls.
- Use local Tailwind utilities for product-specific layout and game visuals.
- Keep cards and panels compact; most app screens are operational tools, not landing pages.
- Use game-mode accent tokens for flavor, but keep shared structure consistent.

## Token Sources

Design tokens live in `apps/web/app/globals.css`.

Use Tailwind v4 token utilities rather than raw color classes for new shared UI:

- App: `bg-app-background`, `text-app-foreground`
- Surfaces: `bg-surface`, `bg-surface-muted`, `bg-surface-raised`
- Borders: `border-border`, `border-border-strong`
- Text: `text-muted`, `text-muted-strong`
- Actions: `bg-primary`, `text-primary`, `bg-primary-soft`, `text-primary-foreground`
- Feedback: `text-success`, `text-warning`, `text-danger`
- Focus: `focus-visible:ring-focus`

## Game Mode Tokens

Game-specific accents are available for reusable cards, badges, and prompt renderers:

| Mode                  | Accent                  | Soft Surface               |
| --------------------- | ----------------------- | -------------------------- |
| Emoji Guess           | `text-game-emoji`       | `bg-game-emoji-soft`       |
| Bad Movie Description | `text-game-description` | `bg-game-description-soft` |
| Gibberish             | `text-game-gibberish`   | `bg-game-gibberish-soft`   |

For TypeScript components, use `getGameModeVisualTokens()` from `apps/web/lib/design-system.ts` instead of duplicating these classes.

## Component Direction

Start with these reusable primitives as screens require them:

- `GameModeCard`: used by `FFH-130` and `FFH-131`.
- `StatusPill`: compact labels for readiness, connection, and game state.
- `Panel`: common dense surface for lobby/gameplay sections.
- `IconButton`: square action button for tool-like actions.

Avoid migrating existing screens just for neatness. Update older UI only when a ticket already touches that area.

## Accessibility

- Every interactive component needs a visible focus state.
- Do not rely on color alone for selected, disabled, success, or error states.
- Keep text readable on soft game-mode surfaces in both light and dark schemes.
- Preserve reduced-motion expectations for any future motion tokens.

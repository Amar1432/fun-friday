## 2025-02-28 - [SVG aria-hidden pattern]

**Learning:** In React/Next.js components, many SVG icons lack `aria-hidden="true"`, which causes screen readers to potentially announce them unnecessarily or redundantly if they are part of a button or link with an aria-label.
**Action:** Always add `aria-hidden="true"` to decorative SVGs, particularly those inside buttons or links that already have an aria-label or accessible text.

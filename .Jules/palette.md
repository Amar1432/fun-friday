## 2026-10-05 - Player Stats Accessibility Improvement

**Learning:** When adding visually hidden screen-reader text near elements with `data-testid` attributes that are targeted by tests via `toHaveTextContent`, the `.sr-only` node must be placed outside the `data-testid` wrapper. Otherwise, the screen reader text gets included in the `textContent` and breaks the tests.
**Action:** When making statistical counters or icon indicators accessible, add `title` to the outer wrapper for hover, `aria-hidden="true"` to decorative SVGs, and place `.sr-only` descriptive text _adjacent_ to (not inside) the data-tested element containing the value.

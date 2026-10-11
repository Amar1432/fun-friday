## 2026-10-11 - Grouped Stat Accessibility
**Learning:** When displaying grouped statistics alongside icons (e.g. player counts), adding `title` attributes on the wrapper along with `.sr-only` text outside the `data-testid` span provides excellent accessibility without breaking existing React Testing Library assertions that look for exact text content.
**Action:** Use `.sr-only` text as siblings to `data-testid` spans rather than inside them when making non-interactive data points accessible.

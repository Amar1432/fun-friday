## 2026-10-10 - Accessible Icon Statistics
**Learning:** When displaying grouped statistics alongside icons in React, improving accessibility requires a combination of `title` on wrappers, `aria-hidden='true'` on SVGs/separators, and visually hidden text nodes.
**Action:** Applied this pattern to lobby player stats to provide context for screen readers without breaking existing UI layouts or test snapshot wrappers.

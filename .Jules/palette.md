## 2024-05-24 - Grouped Statistics Screen Reader Accessibility

**Learning:** When displaying grouped statistics alongside icons (e.g., player count and ready status separated by a '|'), screen readers can read a confusing jumble of numbers and symbols. The visual text separator ('|') must be hidden using `aria-hidden='true'`. Decorative SVGs must also have `aria-hidden='true'`.
**Action:** Always add a `title` attribute to the wrapper element for grouped stats, `aria-hidden='true'` to the decorative SVG and visual text separators, and a visually hidden `<span className='sr-only'>` text node explicitly describing the statistic outside the `data-testid` wrapper to prevent breaking tests.

## 2026-10-31 - Grouped statistics accessibility

**Learning:** When displaying grouped statistics alongside icons, they need proper accessibility markup. This requires a `title` attribute on the wrapper, `aria-hidden='true'` on the SVG to prevent screen readers from reading the icon, and a visually hidden `<span className='sr-only'>` text node describing the statistic.
**Action:** Always add `title`, `aria-hidden` on SVGs, and visually hidden text to icon-based statistics. When adding `.sr-only` text near elements with `data-testid` attributes, explicitly place the `.sr-only` node outside the `data-testid` wrapper to avoid breaking `toHaveTextContent` assertions in existing Jest tests.

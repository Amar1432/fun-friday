## 2024-10-14 - Accessible Grouped Stats

**Learning:** When displaying grouped statistics alongside icons, improve accessibility by adding a `title` attribute to the wrapper, `aria-hidden='true'` to the SVG, and a visually hidden `<span className='sr-only'>` text node describing the statistic, carefully placing it outside `data-testid` wrappers to prevent breaking `toHaveTextContent` in existing tests.
**Action:** Always follow this pattern for icon-based grouped statistics to ensure screen readers provide useful context without breaking existing testing infrastructure.

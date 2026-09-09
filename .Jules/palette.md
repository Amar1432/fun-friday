## 2026-09-09 - Grouped Statistics Accessibility

**Learning:** Grouped inline statistics (like "Total Players" and "Ready Players") alongside icons often lack necessary context for screen reader users and tooltips for sighted users.
**Action:** When displaying grouped statistics alongside icons, improve accessibility by adding a `title` attribute to the wrapper, `aria-hidden='true'` to the SVG and any separators, and a visually hidden `<span className='sr-only'>` text node describing the statistic.

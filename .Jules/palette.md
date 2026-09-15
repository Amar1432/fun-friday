## 2026-09-15 - Improved Accessibility for Grouped Statistics

**Learning:** Sighted users can interpret grouped statistics with icons (like total players or ready players) by context, but screen readers may simply read disjointed numbers which removes the context. Using only `aria-label` on wrappers is sometimes insufficient for consistent interpretation if the inner HTML is complex.

**Action:** When displaying grouped statistics alongside icons, improve accessibility by adding a `title` attribute to the wrapper (for mouse hover tooltips), `aria-hidden='true'` to the SVGs and layout separators, and a visually hidden `<span className='sr-only'>` text node that explicitly describes the statistic.

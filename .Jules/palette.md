## 2026-09-21 - Accessible Grouped Statistics

**Learning:** When displaying grouped statistics alongside icons, they can be inaccessible to screen readers without explicit contextual information.
**Action:** Add a `title` attribute to the wrapper for hover context, add `aria-hidden='true'` to decorative SVGs, and include a visually hidden `<span className='sr-only'>` text node to explicitly describe the statistic for screen readers.

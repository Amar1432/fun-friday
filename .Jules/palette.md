## 2026-09-20 - Accessible Grouped Statistics

**Learning:** Grouped statistics accompanied by icons (e.g. "[icon] 10 | [icon] 5/10") can be ambiguous for screen reader users if the icons are decorative and the numbers lack context.
**Action:** When displaying grouped statistics alongside icons, improve accessibility by adding a `title` attribute to the wrapper, `aria-hidden='true'` to the SVG, and a visually hidden `<span className='sr-only'>` text node describing the statistic before the value.


## 2026-10-13 - Accessible Grouped Statistics
**Learning:** When displaying grouped statistics alongside icons (e.g. "Total Players: [icon] 5 | Ready Players: [icon] 5/5"), simply wrapping them in `<span>` tags is not enough. Screen readers may misinterpret or conflate the text blocks without proper separation.
**Action:** When implementing grouped statistics with icons, improve accessibility by adding a `title` attribute to the wrappers, setting `aria-hidden="true"` to the SVG icons, and including a visually hidden `<span className="sr-only">` text node describing the statistic (e.g. "Total Players:").

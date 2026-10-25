## 2024-10-25 - Ensure Custom Interactive Elements Have Focus Rings

**Learning:** Custom native interactive elements like `<button>` and `<a>` do not automatically inherit unified UI component focus styles, leaving keyboard users without visual feedback when tabbing.
**Action:** When adding or auditing raw native `<button>` or `<a>` elements (especially those not using a standard component library), explicitly append standard Tailwind focus classes like `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950` to ensure keyboard accessibility.

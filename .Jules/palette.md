## 2024-08-09 - Ensure keyboard accessibility with focus-visible styles
**Learning:** Native elements (like `<button>` and `<a>`) inside `apps/web/` often lack keyboard focus styles if not explicitly provided, reducing accessibility.
**Action:** When working on interactive UI elements or replacing/creating custom buttons, always remember to attach the focus ring utility classes: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950`.

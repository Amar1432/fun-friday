## 2026-10-18 - [Add Focus Rings to Text and Logo Buttons]

**Learning:** When developing multi-step flows (like room creation), native interactive elements used for navigation like text-only links/buttons in footers or logo home buttons in headers frequently miss the standard focus ring styling since they do not use the design system's unified button components. This breaks keyboard accessibility on important navigation paths.
**Action:** Always explicitly add the standard Tailwind focus ring classes (`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950`) and a `rounded` class to custom native `<button>` and `<a>` elements, especially checking header logos and plain text links.

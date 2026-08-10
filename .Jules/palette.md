## 2024-08-10 - Missing Focus Rings on Native Buttons

**Learning:** Native `<button>` elements in this project do not automatically inherit unified UI component focus styles and must explicitly include Tailwind focus ring classes (`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950`) to ensure keyboard accessibility.
**Action:** When adding or modifying native interactive elements, always explicitly add standard Tailwind focus ring classes to support keyboard users.

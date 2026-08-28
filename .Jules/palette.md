## 2024-08-28 - Add Focus Rings to Native Elements

**Learning:** Custom native interactive elements like `<button>` and `<a>` do not inherit the default unified UI component focus styles, leaving them invisible to keyboard users when focused.
**Action:** Always append the standard focus ring classes (`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950`) to custom native interactive elements to ensure consistent keyboard accessibility.

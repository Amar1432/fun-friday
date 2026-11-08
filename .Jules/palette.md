## 2024-11-08 - Accessible Decorative SVGs

**Learning:** When using SVG icons inside interactive elements like buttons (especially icon-only buttons), screen readers might announce the SVG redundantly if it lacks proper attributes, or read out empty paths. This is particularly noticeable when the parent element already has a clear `aria-label` or descriptive text.
**Action:** Always add `aria-hidden="true"` to decorative SVGs within UI components. This ensures screen readers ignore the graphical representation and instead rely on the parent's semantic `aria-label` or visible text, improving the overall accessibility experience for users relying on assistive technologies.

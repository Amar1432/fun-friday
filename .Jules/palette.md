## 2024-07-26 - Add Aria Labels and Input Counters
**Learning:** Icon-only buttons often lack accessible names. Text inputs with length limits provide a better experience when they offer visual feedback of characters remaining.
**Action:** Added `aria-label` and `title` to the icon-only Logout button, `aria-hidden` to the decorative SVG, and an inline length counter (`[length]/[maxLength]`) for the bounded "Your Name" input field.

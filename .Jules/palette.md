## 2026-10-30 - Added Focus Rings to Create Room Page Buttons
**Learning:** Found that custom native interactive elements like `<button>` on the Create Room page didn't inherit unified UI component focus styles, requiring explicit Tailwind focus ring classes (`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950`).
**Action:** Applied these utility classes to the "F" (home), "Back to Dashboard", and "Go to lobby now" buttons to ensure keyboard accessibility.

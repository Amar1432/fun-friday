## 2024-08-12 - Added keyboard focus state to Create Room page buttons
**Learning:** Found that custom/native button elements in this app's components (like navigation logos) sometimes lack proper focus states for keyboard users.
**Action:** Always ensure that any `<button>` or custom interactive element includes Tailwind focus classes like `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950` to improve accessibility.

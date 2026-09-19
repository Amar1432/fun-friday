## 2025-05-24 - Add accessible grouped statistics in lobby controls

**Learning:** When displaying grouped statistics (e.g., player counts) next to icons, screen readers often miss the context. Adding a visually hidden `<span className="sr-only">` helps provide semantic meaning without disrupting the visual design.
**Action:** Always wrap statistics in a container with a `title` attribute for mouse users, and include `.sr-only` text alongside the value for screen readers. Add `aria-hidden="true"` to decorative elements and separators.

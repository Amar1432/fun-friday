## 2024-06-25 - Native Tooltips on Interactive Disabled States

**Learning:** Adding a native `title` attribute to disabled buttons is an extremely effective micro-UX pattern to explain _why_ an action is currently unavailable, particularly in dynamic interfaces like a game lobby waiting for players. This avoids the need to implement complex tooltip components while significantly improving accessibility and clarity.
**Action:** Always check if a dynamically disabled button provides user feedback on its state, and if not, add a contextual `title` attribute.

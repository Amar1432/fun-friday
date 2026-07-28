## 2026-07-28 - Native Tooltips for Disabled Buttons
**Learning:** HTML 'title' attributes don't reliably trigger on disabled buttons because they don't fire mouse events. Using a wrapper element with 'title' while setting the disabled button to 'pointer-events-none' solves this cleanly without third-party tooltips.
**Action:** Use a wrapper span with 'title' and apply 'pointer-events-none' to disabled buttons for native accessible tooltips.

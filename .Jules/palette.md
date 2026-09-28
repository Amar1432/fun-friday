## 2026-09-28 - [Accessible Visually Hidden Text]
**Learning:** When adding visually hidden screen-reader text (`.sr-only`) near elements with `data-testid` attributes, it's critical to place the `.sr-only` node OUTSIDE the `data-testid` wrapper.
**Action:** This avoids breaking `toHaveTextContent` assertions in existing tests by preventing the hidden text from being included in the test element's text content.

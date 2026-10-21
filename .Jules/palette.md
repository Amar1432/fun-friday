## 2024-10-21 - Placing screen reader text for grouped statistics safely

**Learning:** When adding visually hidden screen-reader text (`.sr-only`) near elements with `data-testid` attributes used in `toHaveTextContent` assertions (like player counts), placing the `.sr-only` element _inside_ the `data-testid` element will break existing tests as the text content will change.
**Action:** Always place `.sr-only` descriptions outside of the targeted `data-testid` element to maintain backwards compatibility with existing UI tests.

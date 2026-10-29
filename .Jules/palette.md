## 2023-10-29 - Visually Hidden Text vs Jest DOM Assertions

**Learning:** When adding `.sr-only` text to improve screen reader context next to elements selected via `data-testid`, placing the `.sr-only` node _inside_ the `data-testid` wrapper breaks existing tests that assert exact text content using `toHaveTextContent()`.
**Action:** Place `.sr-only` description nodes just _outside_ the `data-testid` wrapper. This correctly provides context to screen readers for the surrounding block without polluting the specific text string verified by snapshot or DOM assertions.

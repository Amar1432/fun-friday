## 2026-10-02 - Accessible Grouped Statistics

**Learning:** Adding accessibility to icon-plus-number groupings via standard `aria-label`s directly on wrappers can break `toHaveTextContent` in Jest tests if not careful. Text nodes become concatenated in DOM tests.
**Action:** When displaying grouped statistics alongside icons, use a `title` attribute on the wrapper, `aria-hidden='true'` on the SVG icon, and a visually hidden `<span className='sr-only'>` text node describing the statistic placed _outside_ the specific `data-testid` wrapper to avoid breaking targeted `toHaveTextContent` assertions in existing tests.

## 2024-09-27 - Grouped Statistics Accessibility & Testing Boundaries

**Learning:** When adding visually hidden screen reader text (`.sr-only`) to grouped statistics that are wrapped with `data-testid` attributes, placing the visually hidden node _inside_ the `data-testid` element can break existing test assertions like `toHaveTextContent` because the expected raw value changes (e.g., tests expect `{readyCount}/{totalCount}` but receive `Ready players: {readyCount}/{totalCount}`).
**Action:** Always place `.sr-only` descriptive nodes _outside_ the `data-testid` wrappers to enhance accessibility while strictly respecting existing testing boundaries. Ensure wrappers use `title` attributes and icons use `aria-hidden="true"`.

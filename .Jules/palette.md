## 2024-03-24 - Inline Player Stat Accessibility
**Learning:** Adding screen reader text directly inside elements targeted by testing tools (e.g. data-testid) can break existing strict text assertions (`toHaveTextContent`).
**Action:** Always place `.sr-only` descriptions on sibling elements rather than wrapping or prepending inside the targeted text node to keep tests green while improving a11y.

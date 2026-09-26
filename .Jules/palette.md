## 2026-09-26 - Accessible Grouped Stat Icons
**Learning:** Adding screen reader text directly adjacent to visually informative text values inside a `data-testid` wrapper causes Jest text assertions (`toHaveTextContent`) to fail because the content technically includes the hidden text.
**Action:** Always wrap the descriptive visually-hidden text outside of the `data-testid` span that holds the dynamic value. Add `title` attribute to the wrapping container for mouse users and `aria-hidden="true"` to decorative icons.

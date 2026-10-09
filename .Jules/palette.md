## 2023-10-24 - Accessible Grouped Statistics Alongside Icons

**Learning:** When displaying grouped statistics (e.g., `1/4` players ready) alongside decorative icons (like an SVG people icon), simply wrapping them in a span without proper ARIA or visually hidden text makes the output unhelpful for screen-readers. Furthermore, adding visually hidden text (`.sr-only`) _inside_ a `data-testid` element can inadvertently break existing integration or unit tests that rely on exact text matching using `toHaveTextContent`.

**Action:** When improving accessibility for such patterns, add a `title` attribute to the parent wrapper, mark the SVG as `aria-hidden="true"`, and place a `<span className="sr-only">Descriptive Text:</span>` element _outside_ the specific span that holds the `data-testid` for the data itself. This properly contextualizes the statistic for screen-readers without causing regressions in existing test suites.

## 2023-10-26 - Accessible Grouped Statistics

**Learning:** When displaying grouped statistics alongside icons (e.g. player count or ready count), tests asserting text content (like `toHaveTextContent`) can easily break if visually hidden screen-reader text (`.sr-only`) is added directly inside the elements being tested (like `data-testid`).
**Action:** Add a `title` attribute to the wrapper, `aria-hidden='true'` to the SVG, and a visually hidden `<span className='sr-only'>` text node describing the statistic, but strictly place the `.sr-only` node outside the `data-testid` wrapper to avoid breaking `toHaveTextContent` assertions in existing tests.

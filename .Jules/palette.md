## 2026-10-16 - Accessibility for Grouped Stats with Icons

**Learning:** Adding screen reader-only text (`.sr-only`) inside an element with a `data-testid` that is targeted by `toHaveTextContent` assertions in tests will cause those tests to fail, because the test text will include the hidden text. Also, decorative icons next to text stats should be hidden from screen readers.
**Action:** When making grouped statistics with icons more accessible, add a `title` to the wrapper, add `aria-hidden='true'` to decorative SVG icons, and add a visually hidden `<span className='sr-only'>` for screen readers placed _outside_ the `data-testid` node so snapshot and `textContent` tests don't break.

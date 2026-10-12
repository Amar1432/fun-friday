## 2024-10-12 - Adding Copy Feedback to Buttons
**Learning:** Providing temporary visual feedback when a user clicks a button to copy text improves the perceived responsiveness of the UI and confirms the action for the user without requiring them to check their clipboard.
**Action:** When creating copy to clipboard functionality, always swap the button state momentarily (e.g. text/icon updates to 'Copied!' and styling change) and set a timeout to revert it back to normal.

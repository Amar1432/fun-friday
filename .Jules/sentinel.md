## 2026-10-10 - Error Handling on Promises
**Learning:** When invoking a method that returns a promise directly on an object, using the optional chaining operator `?.catch()` safely handles cases where the method might unexpectedly return undefined or throw synchronously without returning a promise.
**Action:** Applied this pattern to Redis updates in the game gateway to prevent uncaught promise rejections from crashing the app.

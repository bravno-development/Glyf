# UI Layout Bootstrap

- **App-wide bootstrap and subscriptions live in root `+layout.svelte` `onMount`.** Examples: analytics init, seeding data, `userStore.init()`, user subscription (sync + analytics), sync interval. **Clean up in the return function** (clear intervals, unsubscribe).

# UI Svelte 5 Runes

- **Use runes everywhere.** Follow the latest Svelte 5 style: `$state()` for component state, `$effect()` for reactive side effects, `$props()` for component props. No legacy `let` + `$:` reactive declarations for new code.
- **Auth-dependent side effects:** Use `$effect` and guard with `initialised` first, then check `isAuthenticated` (e.g. redirect to login). See [user-store-initialised](user-store-initialised.md).
- **Layout/cleanup:** Use `onMount` when you need a single run on mount or cleanup (e.g. intervals, subscriptions). Runes handle reactivity; `onMount` handles lifecycle.

```ts
let email = $state("");
let loading = $state(false);

$effect(() => {
  if (!$userStore.initialised) return;
  if (!$userStore.isAuthenticated) goto("/auth/login");
});
```

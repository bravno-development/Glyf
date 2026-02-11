# UI User Store & `initialised`

- The user store exposes **`initialised: boolean`**. It is set to `true` in `init()` after reading `localStorage` (and in `login`/`logout`). Until then, we don't know if the user is authenticated.
- **Guard auth-dependent logic:** In any `$effect` or flow that redirects or fetches based on auth, start with `if (!$userStore.initialised) return;` then check `isAuthenticated`. Prevents flashing the wrong route (e.g. dashboard then redirect) before localStorage is read.

```ts
$effect(() => {
  if (!$userStore.initialised) return;
  if (!$userStore.isAuthenticated) {
    goto("/auth/login");
  }
});
```

- Same idea for onboarding checks, protected content, etc.: wait for `initialised` before acting on auth state.

# UI Page Error Handling

- **Current pattern:** For API calls, use try/catch in the page. Set a local `error` state and show it in the markup (e.g. above the form). Use `err instanceof Error ? err.message : '...'` so the message is always a string. The API client throws with the server's user-facing message.
- **No global error UI yet.** A global toast or banner is planned. When it exists, pages can call it (instead of or in addition to local error state). Until then, keep handling errors locally per page.

```ts
let error = $state("");
try {
  await api.auth.requestLink(email);
  step = "code";
} catch (err) {
  error = err instanceof Error ? err.message : "Failed to send code";
} finally {
  loading = false;
}
```

```svelte
{#if error}
  <div class="... bg-[var(--color-error)] ...">{error}</div>
{/if}
```

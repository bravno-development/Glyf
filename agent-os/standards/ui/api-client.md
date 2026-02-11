# UI API Client

- **Single `fetchApi<T>(endpoint, options)`** in `$lib/services/api.ts`. Base
  URL from `VITE_API_URL` (fallback `http://localhost:8000`). Sets
  `Content-Type: application/json` and `Authorization: Bearer <token>` from
  `localStorage.getItem('authToken')`.
- **On `!response.ok`:** Parse JSON, read `error` field, then
  `throw new Error(error.error || 'Request failed')`. API returns user-friendly
  messages, so throwing is safe and callers use `err.message` in catch.
- **Export** a namespaced object: `api.auth`, `api.sync`, `api.onboarding`, etc.
  Each method returns the response body directly (no envelope). Use generics for
  typed responses: `fetchApi<{ onboarded: boolean }>(...)`.
- **No interceptors** for now. Add refresh-token and logging later when needed.

```ts
// Usage in pages
try {
	const result = await api.auth.verify({ email, code });
	userStore.login(result.user, result.token);
} catch (err) {
	error = err instanceof Error ? err.message : "Verification failed";
}
```

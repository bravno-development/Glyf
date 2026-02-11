# UI Auth Token

- **Store the auth token in `localStorage`** under the key `authToken`. The user store owns it: set on login, remove on logout. The API client reads it for every request (`Authorization: Bearer <token>`).
- **Why localStorage:** We're building a PWA. localStorage persists across tabs and restarts and is more dependable than cookies for this setup. sessionStorage does not persist, so it's not used for auth.
- **Hydration:** Root layout calls `userStore.init()` in `onMount` so the store is filled from localStorage before any auth-dependent logic runs.

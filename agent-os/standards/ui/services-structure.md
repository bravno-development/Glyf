# UI Services Structure

- **Services are stateless.** They use `api` and/or `db`; they do not hold UI state. Auth and other reactive UI state live in stores (e.g. `userStore`).
- **`api.ts`** — HTTP only: single `fetchApi` and namespaced methods. No stores.
- **`db.ts`** — Dexie schema and singleton `db` instance. Other services import it for IndexedDB access.
- **Other services** (sync, dashboard, srs, scripts, analytics) — Pure functions or logic that call `api` and/or `db`. No global mutable state.

# Standards for Study Reminders

The following standards apply to this work.

---

## api/route-layout

- **One Express Router per domain.** Create a router in `src/routes/<domain>.routes.ts` (e.g. `auth.routes.ts`, `user.routes.ts`, `sync.routes.ts`, `onboarding.routes.ts`).
- **Mount under `/api/<domain>`** in `main.ts`. No version prefix (e.g. no `/api/v1/`).
- **Protected routers:** Call `router.use(authMiddleware)` before defining routes so every route on that router requires auth.
- **Public routers:** Do not use auth middleware (e.g. `/api/auth`).

```ts
// main.ts
app.use("/api/auth", authRoutes);
app.use("/api/sync", syncRoutes);
app.use("/api/user", userRoutes);
app.use("/api/onboarding", onboardingRoutes);
```

```ts
// routes/user.routes.ts
export const userRoutes = express.Router();
userRoutes.use(authMiddleware);
userRoutes.get("/profile", getProfile);
```

- Health/other non-API routes can live on `app` directly (e.g. `app.get("/health", ...)`).

---

## api/database-access

- Use the single **`query(text, params)`** helper from `config/database.ts`. It acquires a client, runs the query, and releases the client. Controllers do not use the pool directly.
- **Parameterized queries only:** use `$1`, `$2`, …; never interpolate user input into SQL.
- **No ORM.** Raw SQL and the `postgres` driver (via `imports.ts`).
- **Typing:** Cast `result.rows` in the controller (e.g. `as Record<string, unknown>` or a concrete type). Shared typed helpers for specific queries can be added later if the API grows.

```ts
const result = await query("SELECT id, email FROM users WHERE id = $1", [userId]);
const user = result.rows[0] as Record<string, unknown>;
```

- `DATABASE_URL` is required at startup; the config module throws if it is missing.

---

## api/error-responses

Use HTTP status codes and a single `error` field with a short, user-friendly message.

```json
res.status(400).json({ error: "Email is required" });
res.status(401).json({ error: "No token provided" });
res.status(404).json({ error: "User not found" });
res.status(500).json({ error: "Failed to fetch profile" });
```

- **Always** set the correct status (4xx client, 5xx server) and include `error: string`.
- Keep messages **short and safe** for the client; log full details server-side.
- Extra fields (e.g. `field`, `code`) are allowed when needed; for now status + `error` is enough.
- No error codes (e.g. AUTH_001); this project keeps it simple.
- Global error handler may add `message` and `stack` in development only.

---

## api/validation

- **Validate in the controller.** Check `req.body` (and params/query if needed) at the start of the handler. No shared validation layer or schema library for now; the project is small and in early stages. Add a schema lib (e.g. Zod) later if needed.
- **On validation failure:** `return res.status(400).json({ error: "..." })` with a short, user-friendly message. Use the same error shape as in error-responses.

```ts
if (!email || typeof email !== "string") {
	return res.status(400).json({ error: "Email is required" });
}
```

- The rule stays: validate in the controller and respond with 400 + `{ error }`.

---

## ui/api-client

- **Single `fetchApi<T>(endpoint, options)`** in `$lib/services/api.ts`. Base URL from `VITE_API_URL`. Sets `Content-Type: application/json` and `Authorization: Bearer <token>` from `localStorage.getItem('authToken')`.
- **On `!response.ok`:** Parse JSON, read `error` field, then `throw new Error(error.error || 'Request failed')`.
- **Export** a namespaced object: `api.auth`, `api.sync`, `api.user`, `api.notifications`, etc. Each method returns the response body directly.

---

## ui/services-structure

- **Services are stateless.** They use `api` and/or `db`; they do not hold UI state. Auth and other reactive UI state live in stores (e.g. `userStore`).
- **`api.ts`** — HTTP only: single `fetchApi` and namespaced methods. No stores.
- Other services — Pure functions or logic that call `api` and/or `db`. No global mutable state.

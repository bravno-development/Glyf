# API Database Access

- Use the single **`query(text, params)`** helper from `config/database.ts`. It acquires a client, runs the query, and releases the client. Controllers do not use the pool directly.
- **Parameterized queries only:** use `$1`, `$2`, …; never interpolate user input into SQL.
- **No ORM.** Raw SQL and the `postgres` driver (via `imports.ts`).
- **Typing:** Cast `result.rows` in the controller (e.g. `as Record<string, unknown>` or a concrete type). Shared typed helpers for specific queries can be added later if the API grows.

```ts
const result = await query("SELECT id, email FROM users WHERE id = $1", [userId]);
const user = result.rows[0] as Record<string, unknown>;
```

- `DATABASE_URL` is required at startup; the config module throws if it is missing.

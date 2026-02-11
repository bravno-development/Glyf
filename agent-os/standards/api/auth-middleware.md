# API Auth Middleware

- **`AuthRequest`** extends Express `Request` with `userId?: string` (set by
  middleware). Keeps handlers minimal — only the user id, not the full user.
- **Protected routes:** Use `router.use(authMiddleware)` on the router so every
  route on that router requires a valid JWT. Handlers use `req.userId!`.
- **Public routes:** No auth middleware. Used for login/verify (e.g.
  `/api/auth/*`) and any future endpoints that work without auth (e.g. landing).
- **Optional auth** (logged-in gets more, anonymous still works): not used yet;
  add per-route or conditional auth when needed.

```ts
// routes/user.routes.ts
userRoutes.use(authMiddleware);
userRoutes.get("/profile", getProfile);

// controller
export async function getProfile(req: AuthRequest, res: Response) {
	const userId = req.userId!;
	// ...
}
```

- Auth middleware: read `Authorization: Bearer <token>`, verify JWT, set
  `req.userId = payload.sub`. On failure respond with 401 and
  `{ error: "No token provided" }` or `{ error: "Invalid token" }`.

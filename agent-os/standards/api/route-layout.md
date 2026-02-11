# API Route Layout

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

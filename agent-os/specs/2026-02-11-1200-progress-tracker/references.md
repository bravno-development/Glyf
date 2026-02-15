# References for Progress Tracker

## Similar Implementations

### Sync controller

- **Location:** `api/src/controllers/sync.controller.ts`
- **Relevance:** Upload/download of review data; auth via req.userId; query()
  usage; 400/500 error shape.
- **Key patterns:** INSERT/ON CONFLICT for user_sync_state and user_progress;
  JSON.stringify(reviews); cast result.rows.

### Sync routes

- **Location:** `api/src/routes/sync.routes.ts`
- **Relevance:** Router layout, authMiddleware on router, POST and GET.
- **Key patterns:** express.Router(), syncRoutes.use(authMiddleware),
  syncRoutes.post("/", ...), syncRoutes.get("/", ...).

### DB (IndexedDB schema)

- **Location:** `ui/src/lib/services/db.ts`
- **Relevance:** Review shape (itemId, script, easeFactor, interval,
  repetitions, nextReview, lastReview); itemType 'character' | 'sentence'.
- **Key patterns:** Use itemType === 'character' when filtering for progress
  backfill; same field names for SM-2.

### SRS service

- **Location:** `ui/src/lib/services/srs.ts`
- **Relevance:** SM-2 algorithm (calculateNextReview); getDueCards; grade 0–5,
  easeFactor, interval, repetitions.
- **Key patterns:** Mirror this logic on server for POST /progress/attempts
  upsert of item_progress.

### Dashboard service

- **Location:** `ui/src/lib/services/dashboard.ts`
- **Relevance:** Stats from local reviews; getDueCards usage; mastery levels.
- **Key patterns:** Dashboard stays local for MVP; optional later: merge server
  due count.

### API client

- **Location:** `ui/src/lib/services/api.ts`
- **Relevance:** fetchApi, api.auth, api.sync, api.onboarding namespace; Bearer
  token, throw on error.
- **Key patterns:** Add api.progress.submitAttempts(payload),
  api.progress.getDue(script).

### Dashboard page

- **Location:** `ui/src/routes/dashboard/+page.svelte`
- **Relevance:** $state, $effect, initialised guard, onMount data load.
- **Key patterns:** No change for MVP; learn flow is where submitAttempts is
  called.

### Onboarding controller and routes

- **Location:** `api/src/controllers/onboarding.controller.ts`,
  `api/src/routes/onboarding.routes.ts`
- **Relevance:** Validation (script, dailyGoal); user_progress INSERT/ON
  CONFLICT; 400/500 responses.
- **Key patterns:** Same validation and error style for progress endpoints.

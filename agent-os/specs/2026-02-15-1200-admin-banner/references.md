# References for Admin Banner

## Similar Implementations

### ReminderBanner

- **Location:** `ui/src/lib/components/ReminderBanner.svelte`
- **Relevance:** Top bar placement, flex layout, design tokens (bg-[var(--primary)], rounded-[var(--radius-xs)]), button pattern.
- **Key patterns:** Banner in root layout; conditional show; same token-based styling for AdminBanner (muted/destructive for admin vs primary for reminder).

### SRS and due logic

- **Location:** `ui/src/lib/services/srs.ts`, `ui/src/lib/services/dashboard.ts`
- **Relevance:** getDueCards and getUpcomingReviews use "now" for due filtering; calculateNextReview uses current date for nextReview/lastReview.
- **Key patterns:** Replace `new Date()` with getNow() from adminTime store so time travel affects all due/today logic.

### Learn store

- **Location:** `ui/src/lib/stores/learn.ts`
- **Relevance:** todayKey() uses current date for "introduced today" and daily cap.
- **Key patterns:** Use getNow().toISOString().slice(0, 10) in todayKey so simulated date aligns with SRS.

### Root layout

- **Location:** `ui/src/routes/+layout.svelte`
- **Relevance:** Where ReminderBanner is rendered; onMount for auth/sync.
- **Key patterns:** Add AdminBanner above ReminderBanner; no other layout changes.

### Auth and onboarding

- **Location:** `api/src/middleware/auth.ts`, `api/src/controllers/onboarding.controller.ts`
- **Relevance:** Admin route uses authMiddleware for req.userId; after reset, user has no user_progress so onboarding status is false.
- **Key patterns:** Admin controller checks Origin/Referer for localhost; DELETEs by user_id; client redirects to /onboarding.

### Sync and user data tables

- **Location:** `api/src/controllers/sync.controller.ts`, migrations (001, 004)
- **Relevance:** user_sync_state, user_progress, item_progress, attempt_records, notifications, pending_reminder_deliveries all keyed by user_id.
- **Key patterns:** Admin reset DELETE from each table for req.userId in a single controller.

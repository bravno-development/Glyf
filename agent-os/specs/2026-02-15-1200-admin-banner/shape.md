# Admin Banner — Shaping Notes

## Scope

Admin-only banner visible on localhost with:
- **Reset account**: Wipe IndexedDB and Postgres for the current user (new endpoint); user stays logged in and is sent to onboarding.
- **Time travel**: Simulated "now" (offset in ms, persisted) so SRS due logic and "today" in the learn store use getNow() for testing.

## Decisions

- **Localhost-only**: Banner and reset endpoint are gated by hostname (UI) and Origin/Referer (API). No env var; explicitly for local dev/testing.
- **Reset = data clear, not logout**: Same session after reset; server DELETEs from six user-scoped tables; client deletes GlyfDB and admin localStorage, then redirects to /onboarding.
- **Single getNow()**: One source of "current time" for all SRS and daily-cap logic (srs.ts, dashboard.ts, learn store) so time travel is consistent.
- **Confirm before reset**: Admin banner shows "Reset account" then "Confirm reset" / "Cancel" to avoid accidental wipes.

## Context

- **Visuals:** None.
- **References:** ReminderBanner (placement and style), srs.ts (getDueCards, calculateNextReview), dashboard.ts (getUpcomingReviews), learn store (todayKey), +layout.svelte; onboarding and auth routes for redirect flow.
- **Product alignment:** Testing and local development only; not a product feature.

## Standards Applied

- api/route-layout — New router under /api/admin; auth middleware.
- api/error-responses — 403 for non-localhost; 500 + { error } on failure.
- api/auth-middleware — req.userId for DELETEs.
- ui/design-tokens — Banner uses var(--muted), var(--foreground), var(--destructive), var(--secondary), var(--radius-xs).
- ui/api-client — fetchApi, Bearer token; admin.reset() added.
- ui/services-structure — admin.ts and adminTime store; no UI state in services.

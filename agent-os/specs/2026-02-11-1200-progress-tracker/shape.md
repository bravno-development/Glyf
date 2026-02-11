# Progress Tracker — Shaping Notes

## Scope

Progress tracker for each user: per-item (character/glyph only) SM-2 progress, attempt records, user–script stats (words_studied_today, last_study_date), and manifest versioning for cache invalidation. Offline-first unchanged; API receives attempt submissions and serves normalized progress for cross-device and analytics.

## Decisions

- **Character-only** — No data retained for sample sentences; server and sync handle character item_ids only.
- **Normalized tables + keep blob sync** — Add `item_progress` and `attempt_records`; keep existing `user_sync_state.review_data` blob. Sync upload backfills `item_progress` from blob (character reviews only).
- **Idempotency via uuid_local** — Client sends `uuid_local` per attempt; server ignores duplicate `(user_id, uuid_local)`.
- **user_progress** — Add `words_studied_today`; ensure `last_review_date` exists. Reset policy for words_studied_today (e.g. midnight or daily job) to be decided later.
- **Manifest version** — Table and GET endpoint in scope; population (how version gets set) is manual or separate task.

## Context

- **Visuals:** None.
- **References:** sync.controller.ts, sync.routes.ts, db.ts, srs.ts, dashboard.ts, api.ts, dashboard +page.svelte, onboarding controller/routes.
- **Product alignment:** Offline-first, SM-2, minimal backend (mission, roadmap, tech-stack). Progress tracker aligns with sync across devices and basic dashboard.

## Standards Applied

- api/route-layout — One router per domain under /api/progress; authMiddleware on router.
- api/database-access — query() helper, parameterized SQL, cast rows in controller.
- api/error-responses — HTTP status + { error } string.
- api/validation — Inline validation in controller; 400 + { error }.
- ui/api-client — fetchApi, Bearer token, api.progress.* namespace.

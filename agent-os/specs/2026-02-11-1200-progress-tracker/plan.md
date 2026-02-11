# Progress Tracker — Shape Spec & Implementation

## Scope (from shaping)

- **Per-user, per-item progress (characters only)** — Server-side
  `item_progress` table with SM-2 fields (ease_factor, interval, repetitions,
  next_review_at, last_review_at) plus total_attempts, correct_attempts,
  consecutive_correct. Unit of progress: **character/glyph only** (existing
  `itemId` + `script`). No data retained for sample sentences.

- **Attempt records** — Each attempt stored with session_id, step_type, correct,
  response_time_ms, user_response/correct_answer optional; client-generated
  `uuid_local` for idempotent submission.

- **User–script stats** — Extend `user_progress` with words_studied_today (and
  last_study_date if not already sufficient); used for dashboard and streaks.

- **Manifest versioning** — Table and API to track script/course manifest
  version for cache invalidation when course data changes.

- **Alignment** — Offline-first unchanged: IndexedDB remains source of truth for
  learn flow; API receives attempt submissions and serves normalized progress
  for cross-device and analytics.

---

## Task 1: Save Spec Documentation

Create `agent-os/specs/2026-02-11-1200-progress-tracker/` with plan.md,
shape.md, standards.md, references.md, visuals/.

---

## Task 2: Database migration — progress tables and manifest version

Add migration `004_progress_tracker.sql`:

- **item_progress** — Characters only. `(user_id, script, item_id)` unique;
  SM-2: `ease_factor`, `interval`, `repetitions`, `next_review_at`,
  `last_review_at`; stats: `total_attempts`, `correct_attempts`,
  `consecutive_correct`; timestamps. Indexes: `(user_id, script)`,
  `(user_id, script, next_review_at)` for due queries.

- **attempt_records** — Characters only. `user_id`, `script`, `item_id`,
  `step_type`, `correct`, `response_time_ms`, `attempted_at`, `user_response`,
  `correct_answer` (nullable), `session_id`, `uuid_local` (unique per user for
  idempotency). Index: `(user_id, uuid_local)` for dedup.

- **script_manifest_version** — `script` (PK), `version` (int), `updated_at`;
  optionally `data`/checksum for cache busting.

- **user_progress** — Add `words_studied_today` (int, default 0) and ensure
  `last_review_date` exists; consider reset policy for words_studied_today (e.g.
  reset at midnight or via daily job).

---

## Task 3: API progress domain

- **Router** — New `api/src/routes/progress.routes.ts` mounted at
  `/api/progress` in main.ts; `progressRoutes.use(authMiddleware)`.

- **Endpoints**
  - **POST /api/progress/attempts** — Body:
    `{ sessionId: string, attempts: Array<{ itemId, script, stepType, correct, responseTimeMs, uuidLocal, userResponse?, correctAnswer? }> }`.
    Validate in controller (script, itemId, stepType, correct, responseTimeMs,
    uuidLocal required; **character-only** — reject or ignore non-character
    itemIds). 400 + `{ error }`. For each attempt: insert into `attempt_records`
    (ignore duplicate `uuid_local` per user), upsert `item_progress` (compute
    SM-2 on server). Update `user_progress`: increment `words_studied_today`,
    set `last_review_date` to today. Response:
    `{ success: true, accepted: number }`.

  - **GET /api/progress/due?script=** — Return list of item_ids (or minimal
    item_progress rows) due for review for the user for given script; optional
    limit.

  - **GET /api/progress/manifest-versions** — Return `{ [script]: version }`
    from `script_manifest_version` for cache invalidation (optional; can be
    Phase 2).

- **Errors** — 400 validation, 401 auth, 500 with `{ error }`.

- **Types** — Add request/response types in `api/src/models/types.ts` (e.g.
  `SubmitAttemptsPayload`, `AttemptItem`).

---

## Task 4: Sync controller — backfill item_progress from blob

- On **sync upload** (existing `syncUp`): after storing
  `user_sync_state.review_data`, upsert into `item_progress` from the `reviews`
  array **only for itemType === 'character'** (map each character review to
  user_id, script, item_id, ease_factor, interval, repetitions, next_review_at,
  last_review_at, total_attempts/correct_attempts derived or default). Keep both
  blob and normalized tables.

---

## Task 5: UI — progress API client and learn flow integration

- **api.ts** — Add `api.progress.submitAttempts(payload)` and optionally
  `api.progress.getDue(script)`, `api.progress.getManifestVersions()`.

- **Learn flow** — Wherever a review answer is committed, add call to
  `api.progress.submitAttempts` with sessionId, single attempt (itemId, script,
  stepType, correct, responseTimeMs, uuidLocal). Generate `uuidLocal`
  (crypto.randomUUID()) per attempt; stable sessionId per study session. Guard
  with try/catch.

- **Dashboard** — No change required for MVP.

---

## Out of scope for this spec

- Changing SM-2 algorithm; server will mirror it or accept client result.
- **Sentence/sample-sentence data** — Glyph focuses on character progression
  only.
- Manifest version population — document as manual or separate task.
- GDPR "forget me" / delete-account function — not in this spec; add later if
  needed. Use CASCADE on progress tables for referential integrity only.

---

## Execution order

1. Task 1 — Save spec documentation.
2. Task 2 — Run migration 004_progress_tracker.sql.
3. Task 3 — Implement progress routes and controller.
4. Task 4 — Extend sync controller to upsert item_progress from blob.
5. Task 5 — Add api.progress and wire submitAttempts into learn flow.

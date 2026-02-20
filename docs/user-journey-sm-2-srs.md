# SM-2 Spaced Repetition — User Journey

## Overview

Glyf uses the **SM-2 algorithm** to schedule character reviews at optimal
intervals, maximising retention w/ minimum effort. The system is
**offline-first**: all review state lives in the browser's IndexedDB via Dexie.
When the user is online, attempts are submitted to the server for cross-device
sync, analytics, & durability.

Three PostgreSQL tables work together to give progressively wider views of the
same data: individual attempts → per-character state → per-script summary.

---

## Three-Table Architecture

### `attempt_records` — immutable attempt log

Every time a user grades a card, a row is appended. Rows are never updated or
deleted.

| Column             | Type                | Purpose                                            |
| ------------------ | ------------------- | -------------------------------------------------- |
| `id`               | `UUID` (PK)         | Server-generated ID                                |
| `user_id`          | `UUID` (FK → users) | Owner                                              |
| `script`           | `VARCHAR(50)`       | Writing system (e.g. `hiragana`)                   |
| `item_id`          | `VARCHAR(255)`      | Character identifier                               |
| `step_type`        | `VARCHAR(50)`       | Review step (e.g. `recognition`, `recall`)         |
| `correct`          | `BOOLEAN`           | Whether the response was correct                   |
| `response_time_ms` | `INT`               | Milliseconds to respond                            |
| `attempted_at`     | `TIMESTAMPTZ`       | When the attempt occurred                          |
| `user_response`    | `TEXT`              | What the user entered (nullable)                   |
| `correct_answer`   | `TEXT`              | Expected answer (nullable)                         |
| `session_id`       | `VARCHAR(255)`      | Groups attempts within one study session           |
| `uuid_local`       | `UUID`              | Client-generated UUID for idempotent deduplication |

**Unique constraint:** `(user_id, uuid_local)` — the server uses
`ON CONFLICT DO NOTHING` so re-submitting the same attempt is a safe no-op.

### `item_progress` — per-character SM-2 state

The current truth for every character a user has studied. This is the table the
SM-2 algorithm reads from & writes to.

| Column                | Type                | Purpose                                 |
| --------------------- | ------------------- | --------------------------------------- |
| `id`                  | `UUID` (PK)         | Row ID                                  |
| `user_id`             | `UUID` (FK → users) | Owner                                   |
| `script`              | `VARCHAR(50)`       | Writing system                          |
| `item_id`             | `VARCHAR(255)`      | Character identifier                    |
| `ease_factor`         | `REAL`              | SM-2 ease factor (default 2.5, min 1.3) |
| `interval`            | `INT`               | Days until next review                  |
| `repetitions`         | `INT`               | Consecutive successful repetitions      |
| `next_review_at`      | `TIMESTAMPTZ`       | When the card is next due               |
| `last_review_at`      | `TIMESTAMPTZ`       | When the card was last reviewed         |
| `total_attempts`      | `INT`               | Lifetime attempt count                  |
| `correct_attempts`    | `INT`               | Lifetime correct count                  |
| `consecutive_correct` | `INT`               | Current streak of correct answers       |
| `created_at`          | `TIMESTAMPTZ`       | First review timestamp                  |
| `updated_at`          | `TIMESTAMPTZ`       | Last modification timestamp             |

**Unique constraint:** `(user_id, script, item_id)` — one row per character per
user. Upserted via `ON CONFLICT ... DO UPDATE`.

### `user_progress` — per-script summary

Eagle-eye view of a user's progress within a single script.

| Column                | Type                | Purpose                                      |
| --------------------- | ------------------- | -------------------------------------------- |
| `id`                  | `UUID` (PK)         | Row ID                                       |
| `user_id`             | `UUID` (FK → users) | Owner                                        |
| `script`              | `VARCHAR(50)`       | Writing system                               |
| `total_cards_learned` | `INT`               | Characters w/ at least one successful review |
| `total_reviews`       | `INT`               | Lifetime review count                        |
| `streak_days`         | `INT`               | Consecutive days studied                     |
| `last_review_date`    | `DATE`              | Date of most recent review                   |
| `daily_goal`          | `INT`               | Target reviews per day (default 10)          |
| `words_studied_today` | `INT`               | Reviews completed today (resets on new day)  |
| `updated_at`          | `TIMESTAMP`         | Last modification timestamp                  |

**Unique constraint:** `(user_id, script)` — one row per script per user.

---

## SM-2 Algorithm

Both client (`ui/src/lib/services/srs.ts`) & server
(`api/src/controllers/progress.controller.ts`) implement identical SM-2 logic:

### Grade scale

The algorithm accepts grades 0–5. The UI presents three buttons that map to:

| Button           | Grade | Meaning               |
| ---------------- | ----- | --------------------- |
| Fail / Incorrect | 0     | Total blackout        |
| Pass / OK        | 3     | Correct w/ difficulty |
| Perfect / Easy   | 5     | Perfect recall        |

The **server** uses a binary mapping: `correct → 5`, `incorrect → 0`.

### Interval progression

```
if grade < 3:
    repetitions = 0
    interval = 1 day

else:
    if repetitions == 0:  interval = 1 day
    if repetitions == 1:  interval = 6 days
    if repetitions >= 2:  interval = round(interval * easeFactor)
    repetitions += 1
```

### Ease factor adjustment

After a successful review (grade >= 3):

```
EF' = EF + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
EF  = max(1.3, EF')
```

- Grade 5 (perfect): EF increases by +0.1
- Grade 3 (pass): EF decreases by -0.14
- Minimum EF is always **1.3**
- Default starting EF is **2.5**

---

## Review Data Flow

Step-by-step from the user tapping a grade button:

1. **User taps grade** (Fail / Pass / Perfect) on a review card
2. **Client SM-2 calculation** — `calculateNextReview()` in `srs.ts` computes
   the new `easeFactor`, `interval`, `repetitions`, & `nextReview` date
3. **IndexedDB update** — the `reviews` table in Dexie is updated w/ the new
   SM-2 state; the card immediately reflects its new schedule locally
4. **Attempt submitted to server** — the client sends a
   `POST /api/progress/attempts` w/ a batch of attempts, each carrying a
   `uuid_local`
5. **`attempt_records` insert** — the server inserts each attempt w/
   `ON CONFLICT (user_id, uuid_local) DO NOTHING` for idempotent deduplication
6. **`item_progress` read** — the server fetches the current SM-2 state for the
   character (or uses defaults: EF 2.5, interval 0, repetitions 0)
7. **Server SM-2 recalculation** — `nextSm2State()` computes the new state using
   binary grading (`correct ? 5 : 0`)
8. **`item_progress` upsert** — the new SM-2 state, `next_review_at`, accuracy
   counters (`total_attempts`, `correct_attempts`, `consecutive_correct`) are
   upserted
9. **`user_progress` daily counter** — `words_studied_today` is incremented (or
   reset to 1 if `last_review_date` has changed), `last_review_date` is set to
   today

---

## Mastery Levels

The dashboard (`ui/src/lib/services/dashboard.ts`) classifies characters into
five mastery levels based on their current `interval`:

| Level         | Condition                                   | Colour token           |
| ------------- | ------------------------------------------- | ---------------------- |
| **Mastered**  | `interval >= 21` days                       | `--color-success`      |
| **Good**      | `interval >= 6` days                        | `--accent-light-green` |
| **Learning**  | `interval >= 1` day                         | `--color-warning`      |
| **Difficult** | `interval > 0` but `< 1` (reset after fail) | `--color-error`        |
| **New**       | No review or `repetitions === 0`            | `--secondary`          |

---

## Offline-First Sync

### IndexedDB as source of truth

The client Dexie database (`GlyfDB`) holds five tables:

- `characters` — script character data (id, script, character, meaning,
  readings)
- `sentences` — practice sentences
- `reviews` — SM-2 state per item (mirrors `item_progress` conceptually)
- `sessions` — local session logs (cards reviewed, time spent)
- `syncState` — per-script sync metadata (lastSync, pendingChanges)

The user can study entirely offline. All SM-2 scheduling happens locally.

### `uuid_local` deduplication

Each attempt created on the client gets a unique `uuid_local`. When the client
submits attempts, the server's `ON CONFLICT (user_id, uuid_local) DO NOTHING`
ensures:

- Re-submitting after a network retry is safe
- Multiple devices syncing overlapping attempts don't create duplicates

### Blob sync backfill

The legacy `user_sync_state.review_data` JSONB blob stores the full Dexie
`reviews` array per script. On sync-up (`POST /api/sync`), the server:

1. Overwrites the blob in `user_sync_state`
2. Iterates character-type reviews & upserts each into `item_progress`
3. Increments `user_progress.total_reviews`

On sync-down (`GET /api/sync`), the server returns the stored blob so a new
device can hydrate its local IndexedDB.

---

## Key Design Decisions

| Decision                                      | Rationale                                                                                                                                                                                                     |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Character-only scope**                      | Sentences are practice aids; only individual characters carry SRS state. Server & sync ignore sentence items.                                                                                                 |
| **Binary server grading**                     | The server receives `correct: boolean` & maps to grade 5 (correct) or 0 (incorrect). The client may use the full 0–5 scale for finer-grained local scheduling.                                                |
| **Normalised tables + blob sync coexistence** | `item_progress` & `attempt_records` enable server-side queries & analytics. The blob in `user_sync_state` remains for backward-compatible full-state sync. Sync-up backfills normalised tables from the blob. |
| **Immutable attempt log**                     | `attempt_records` is append-only. This enables replay, analytics (response time trends, session grouping), & audit without affecting scheduling state.                                                        |
| **Minimum EF 1.3**                            | Prevents the ease factor from collapsing to zero for struggling cards; the card will still appear frequently but not be permanently stuck.                                                                    |
| **Daily counter reset on date change**        | `words_studied_today` resets when `last_review_date` differs from today, avoiding the need for a cron job.                                                                                                    |

---

## File Reference

| File                                                       | Role                                                                                 |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `api/migrations/001_initial_schema.sql`                    | `users`, `user_sync_state`, `user_progress` base schema                              |
| `api/migrations/003_onboarding.sql`                        | Adds `daily_goal` to `user_progress`                                                 |
| `api/migrations/004_progress_tracker.sql`                  | `item_progress`, `attempt_records`, `words_studied_today`, `script_manifest_version` |
| `ui/src/lib/services/srs.ts`                               | Client-side SM-2 algorithm (`calculateNextReview`, `getDueCards`)                    |
| `ui/src/lib/services/db.ts`                                | IndexedDB schema via Dexie (`GlyfDB`, `Review`, `Character`, etc.)                   |
| `ui/src/lib/services/dashboard.ts`                         | Mastery levels, dashboard stats, character grid, weekly activity                     |
| `api/src/controllers/progress.controller.ts`               | Server SM-2, attempt submission (`submitAttempts`), due queries (`getDue`)           |
| `api/src/controllers/sync.controller.ts`                   | Blob sync (`syncUp` / `syncDown`), `item_progress` backfill                          |
| `agent-os/specs/2026-02-11-1200-progress-tracker/shape.md` | Original shaping spec                                                                |

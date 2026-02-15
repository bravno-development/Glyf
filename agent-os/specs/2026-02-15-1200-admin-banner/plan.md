# Admin banner (localhost-only) with reset and time travel

## Goal

- **Admin banner**: Same placement and style pattern as ReminderBanner (top bar,
  design tokens), shown only when `window.location.hostname` is `localhost` or
  `127.0.0.1`.
- **Reset account**: Clear IndexedDB and Postgres for the current user via a new
  endpoint; user stays logged in.
- **Time travel**: Simulate "current time" for SRS so cards due in the future
  can appear due (e.g. +1 day, +1 week) for testing.

---

## 1. Localhost guard and banner placement

- **When to show**: In browser only and
  `hostname === 'localhost' || hostname === '127.0.0.1'`.
- **Where**: AdminBanner next to ReminderBanner in
  `ui/src/routes/+layout.svelte`. Use design tokens (e.g. `bg-[var(--muted)]`,
  `--destructive` for reset).

---

## 2. Reset account (clear data only; user stays logged in)

### API: `POST /api/admin/reset`

- **Auth**: Protected with auth middleware.
- **Security**: Only allow when request origin is localhost (e.g. `Origin` or
  `Referer` is `http://localhost:5173` or `http://127.0.0.1:5173`). Reject with
  403 otherwise.
- **Behaviour**: For the authenticated user, DELETE all rows where
  `user_id = $1` from: `user_sync_state`, `user_progress`, `item_progress`,
  `attempt_records`, `notifications`, `pending_reminder_deliveries`.
- **Response**: `{ success: true }`.

### Client flow

1. Call `POST /api/admin/reset`.
2. Clear IndexedDB (delete `GlyfDB`).
3. Clear admin localStorage (e.g. `glyf_admin_time_offset`).
4. Do not logout — user stays logged in.
5. Redirect to `/onboarding`.

---

## 3. Time travel for SRS

- **Store**: `$lib/stores/adminTime.ts` — time offset in ms, persisted in
  localStorage; `getNow(): Date` returns real now or simulated now.
- **Use `getNow()`** in: `srs.ts` (getDueCards, calculateNextReview),
  `dashboard.ts` (getUpcomingReviews, getWeeklyActivity), `learn.ts` (todayKey).
- **Banner controls**: "+1 day", "+1 week", "Reset time"; display "Time: real"
  or "Time: +N days".

---

## 4. Files added or changed

| Area            | Action                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Admin time      | `ui/src/lib/stores/adminTime.ts`: timeOffsetMs (writable + localStorage), getNow(), addDay/addWeek/reset.                |
| SRS             | `srs.ts`: getDueCards and calculateNextReview use getNow().                                                              |
| Dashboard       | `dashboard.ts`: getUpcomingReviews and getWeeklyActivity use getNow().                                                   |
| Learn store     | `learn.ts`: todayKey() uses getNow() for date.                                                                           |
| Admin banner    | `ui/src/lib/components/AdminBanner.svelte`: localhost-only; Reset account (confirm), time travel controls.               |
| Layout          | `+layout.svelte`: AdminBanner above ReminderBanner.                                                                      |
| API admin reset | `api/src/routes/admin.routes.ts`, `admin.controller.ts`: auth + localhost-origin check, DELETEs. Mount at `/api/admin`.  |
| API client      | `api.ts`: admin.reset().                                                                                                 |
| Reset helper    | `ui/src/lib/services/admin.ts`: resetAccount() — call API, delete GlyfDB, clear admin localStorage, goto('/onboarding'). |

---

## 5. Behaviour summary

- **Admin banner**: Visible only on localhost; Admin label + Reset account +
  Time travel.
- **Reset account**: POST /api/admin/reset, clear IndexedDB and admin
  localStorage, goto /onboarding. User stays logged in.
- **Time travel**: Persisted offset; getNow() used in SRS due logic, dashboard,
  and learn "today".

No new migrations. Backend change is the new `POST /api/admin/reset` endpoint
only.

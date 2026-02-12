# Study reminders (pg_cron, push-then-email, UTC backend)

## Scope

- **Backend/DB:** All timestamps in UTC. Store user's **local** reminder time + IANA timezone; compute and store `next_reminder_at` (TIMESTAMPTZ).
- **Scheduler:** **pg_cron** (PostgreSQL extension). Schedule lives in the DB and persists across API restarts. pg_cron runs SQL every 15 min to enqueue due users into a `pending_reminder_deliveries` table and advance `next_reminder_at`.
- **Delivery:** Try **mobile/web push** first (if subscription exists and send succeeds); **if not possible or push fails, email the user**. In-app list/badge still shown from `notifications` table.
- **Persistence across restarts:** pg_cron runs regardless of API; pending rows in `pending_reminder_deliveries` are processed when the API starts and on a short interval, so no reminders are lost on restart.

## Architecture

```mermaid
sequenceDiagram
  participant User
  participant UI
  participant API
  participant DB
  participant pg_cron
  participant Push
  participant Email

  User->>UI: Set reminder time + TZ (settings)
  UI->>API: PATCH /api/user/profile
  API->>DB: Store reminder_* + next_reminder_at UTC
  Note over pg_cron: Every 15 min (persisted in DB)
  pg_cron->>DB: Enqueue due users into pending_reminder_deliveries; advance next_reminder_at
  Note over API: On startup + every 1 min
  API->>DB: SELECT pending rows
  loop For each pending user
    API->>Push: Try Web Push (if subscription exists)
    alt Push OK
      API->>DB: INSERT notification, mark pending processed
    else No subscription or push fails
      API->>Email: sendStudyReminderEmail()
      API->>DB: INSERT notification, mark pending processed
    end
  end
  User->>UI: Open app
  UI->>API: GET /api/notifications
  API->>User: Banner/badge + list
```

## Task 1: Save spec documentation

Done. Spec folder: `agent-os/specs/2026-02-12-1400-study-reminders/`.

## Task 2: Branch and migration

- Checkout new branch (e.g. `feature/study-reminders`) from current HEAD.
- Add migration `005_study_reminders.sql`: pg_cron extension, users columns (reminder_enabled, reminder_time_local, timezone, next_reminder_at, push_subscription), pending_reminder_deliveries, notifications, pg_cron job.

## Task 3: User reminder fields and profile API

- Extend types; GET/PATCH profile with reminder fields; validate time and IANA timezone; compute next_reminder_at in UTC.

## Task 4: Notifications API

- New router /api/notifications; GET list, PATCH :id/read, POST read-all; types.

## Task 5: Reminder delivery

- sendStudyReminderEmail; evaluate Web Push (or email-only for MVP); reminderProcessor.ts processes pending_reminder_deliveries on startup + interval.

## Task 6: Settings UI

- Study reminder section: toggle, time picker, timezone; PATCH profile; load from GET profile.

## Task 7: In-app notification display

- API client for notifications; banner/badge in layout or dashboard; mark read.

## Standards applied

- api/route-layout, database-access, error-responses, validation; ui api-client, services-structure.

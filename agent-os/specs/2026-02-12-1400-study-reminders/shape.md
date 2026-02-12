# Study Reminders — Shaping Notes

## Scope

Study reminders that read from the user table the time a user has set to be reminded. Backend/DB in UTC. Store user's local reminder time + IANA timezone; compute and store `next_reminder_at` (TIMESTAMPTZ). Deliver via push (if possible) then email fallback; in-app list/badge from notifications table.

## Decisions

- **pg_cron for schedule** — Schedule lives in the DB and persists across API restarts. pg_cron runs SQL every 15 min to enqueue due users into `pending_reminder_deliveries` and advance `next_reminder_at`.
- **Push-then-email delivery** — Try mobile/web push first if subscription exists; if not possible or push fails, email the user.
- **Queue processed on API startup + interval** — API does not own the schedule; it only processes `pending_reminder_deliveries` (on startup and every 1 min) so no reminders are lost on restart.
- **Web Push** — Evaluate feasibility for MVP; if not (e.g. Deno/key setup), email-only with note to add push later.

## Context

- **Visuals:** None.
- **References:** user.controller.ts, email.ts, progress-tracker spec for migration/controller patterns.
- **Product alignment:** Roadmap Phase 2 — Study reminders (notifications when it's time to study).

## Standards Applied

- api/route-layout — New router for notifications; user routes extended for reminder PATCH.
- api/database-access — query() only, parameterized SQL, cast rows in controller.
- api/error-responses — HTTP status + { error } string.
- api/validation — Inline validation in controller; 400 + { error }.
- ui/api-client — fetchApi, Bearer token, namespaced methods.
- ui/services-structure — Stateless services; api/db only.

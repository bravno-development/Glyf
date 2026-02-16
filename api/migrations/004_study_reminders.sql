-- Study reminders: pg_cron schedule, user reminder prefs, pending queue, notifications.
-- All timestamps in UTC (TIMESTAMPTZ, NOW()).

-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- User reminder settings (local time + timezone; next_reminder_at stored in UTC)
ALTER TABLE users ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reminder_time_local TIME;
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS next_reminder_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_subscription JSONB;

-- Queue: pg_cron inserts due users here; API processes and sets processed_at
CREATE TABLE IF NOT EXISTS pending_reminder_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_pending_reminder_deliveries_unprocessed
  ON pending_reminder_deliveries (processed_at) WHERE processed_at IS NULL;

-- In-app notification list
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications (user_id, read_at);

-- Function run by pg_cron: enqueue due users and advance next_reminder_at
CREATE OR REPLACE FUNCTION study_reminders_tick()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO pending_reminder_deliveries (user_id)
  SELECT id FROM users
  WHERE reminder_enabled = true
    AND next_reminder_at IS NOT NULL
    AND next_reminder_at <= NOW()
    AND timezone IS NOT NULL
    AND reminder_time_local IS NOT NULL;

  UPDATE users u
  SET next_reminder_at = (
    ((date(u.next_reminder_at AT TIME ZONE u.timezone) + interval '1 day') + u.reminder_time_local)::timestamp
    AT TIME ZONE u.timezone
  )
  WHERE u.reminder_enabled = true
    AND u.next_reminder_at IS NOT NULL
    AND u.next_reminder_at <= NOW()
    AND u.timezone IS NOT NULL
    AND u.reminder_time_local IS NOT NULL;
END;
$$;

-- Run every 15 minutes (persisted in DB)
SELECT cron.schedule('study-reminders', '*/15 * * * *', 'SELECT study_reminders_tick()');

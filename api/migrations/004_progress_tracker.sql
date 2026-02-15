-- Progress tracker: character-only item progress, attempt records, manifest versioning.
-- All progress tables CASCADE on user delete for referential integrity.

-- Per-user, per-script, per-character SM-2 progress (characters only)
CREATE TABLE IF NOT EXISTS item_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  script VARCHAR(50) NOT NULL,
  item_id VARCHAR(255) NOT NULL,
  ease_factor REAL NOT NULL DEFAULT 2.5,
  interval INT NOT NULL DEFAULT 0,
  repetitions INT NOT NULL DEFAULT 0,
  next_review_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_review_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_attempts INT NOT NULL DEFAULT 0,
  correct_attempts INT NOT NULL DEFAULT 0,
  consecutive_correct INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, script, item_id)
);

CREATE INDEX IF NOT EXISTS idx_item_progress_user_script ON item_progress(user_id, script);
CREATE INDEX IF NOT EXISTS idx_item_progress_due ON item_progress(user_id, script, next_review_at);

-- Individual attempt records (characters only); uuid_local for idempotency
CREATE TABLE IF NOT EXISTS attempt_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  script VARCHAR(50) NOT NULL,
  item_id VARCHAR(255) NOT NULL,
  step_type VARCHAR(50) NOT NULL,
  correct BOOLEAN NOT NULL,
  response_time_ms INT NOT NULL DEFAULT 0,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_response TEXT,
  correct_answer TEXT,
  session_id VARCHAR(255) NOT NULL,
  uuid_local UUID NOT NULL,
  UNIQUE(user_id, uuid_local)
);

CREATE INDEX IF NOT EXISTS idx_attempt_records_user_uuid ON attempt_records(user_id, uuid_local);

-- Extend user_progress with words_studied_today (last_review_date already exists)
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS words_studied_today INT NOT NULL DEFAULT 0;

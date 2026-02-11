-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sync state (stores compressed review data)
CREATE TABLE IF NOT EXISTS user_sync_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  script VARCHAR(50) NOT NULL,
  last_sync TIMESTAMP DEFAULT NOW(),
  review_data JSONB NOT NULL,
  UNIQUE(user_id, script)
);

-- User progress snapshots
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  script VARCHAR(50) NOT NULL,
  total_cards_learned INT DEFAULT 0,
  total_reviews INT DEFAULT 0,
  streak_days INT DEFAULT 0,
  last_review_date DATE,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, script)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sync_state_user_id ON user_sync_state(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);

-- Word Cloud Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: wordcloud_sessions
CREATE TABLE IF NOT EXISTS wordcloud_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  description TEXT,
  background_image_url TEXT,
  theme TEXT DEFAULT 'default',
  max_entries_per_user INTEGER DEFAULT 3,
  time_limit_sec INTEGER,
  grouping_enabled BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'live', 'closed')),
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: wordcloud_entries
CREATE TABLE IF NOT EXISTS wordcloud_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES wordcloud_sessions(id) ON DELETE CASCADE,
  user_hash TEXT NOT NULL,
  word_raw TEXT NOT NULL,
  word_norm TEXT NOT NULL,
  cluster_key TEXT NOT NULL,
  is_blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: wordcloud_summary
CREATE TABLE IF NOT EXISTS wordcloud_summary (
  session_id UUID NOT NULL REFERENCES wordcloud_sessions(id) ON DELETE CASCADE,
  cluster_key TEXT NOT NULL,
  display_word TEXT NOT NULL,
  count INTEGER DEFAULT 1,
  color TEXT DEFAULT '#2D7DD2',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (session_id, cluster_key)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_entries_session_id ON wordcloud_entries(session_id);
CREATE INDEX IF NOT EXISTS idx_entries_user_hash ON wordcloud_entries(session_id, user_hash);
CREATE INDEX IF NOT EXISTS idx_summary_session_id ON wordcloud_summary(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON wordcloud_sessions(status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for sessions table
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON wordcloud_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for summary table
CREATE TRIGGER update_summary_updated_at
  BEFORE UPDATE ON wordcloud_summary
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (optional, for future auth)
ALTER TABLE wordcloud_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wordcloud_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE wordcloud_summary ENABLE ROW LEVEL SECURITY;

-- Public access policies (for now, anyone can read/write)
CREATE POLICY "Allow all access to sessions" ON wordcloud_sessions FOR ALL USING (true);
CREATE POLICY "Allow all access to entries" ON wordcloud_entries FOR ALL USING (true);
CREATE POLICY "Allow all access to summary" ON wordcloud_summary FOR ALL USING (true);

-- Enable Realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE wordcloud_summary;
ALTER PUBLICATION supabase_realtime ADD TABLE wordcloud_sessions;

-- Migration: Add description and background_image_url columns to existing tables
-- Run this if the table already exists without these columns
ALTER TABLE wordcloud_sessions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE wordcloud_sessions ADD COLUMN IF NOT EXISTS background_image_url TEXT;

-- Table: word_quota - Track user's submission attempts and cooldown per session
CREATE TABLE IF NOT EXISTS word_quota (
  session_id UUID NOT NULL REFERENCES wordcloud_sessions(id) ON DELETE CASCADE,
  user_hash TEXT NOT NULL,
  attempts_left INTEGER NOT NULL DEFAULT 3,
  cooldown_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY(session_id, user_hash)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_quota_session_user ON word_quota(session_id, user_hash);

-- Add trigger for updated_at
CREATE TRIGGER IF NOT EXISTS update_quota_updated_at
  BEFORE UPDATE ON word_quota
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS and policy
ALTER TABLE word_quota ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all access to quota" ON word_quota 
  FOR ALL USING (true);

-- Add cooldown_hours to sessions table
ALTER TABLE wordcloud_sessions ADD COLUMN IF NOT EXISTS cooldown_hours INTEGER DEFAULT 1;



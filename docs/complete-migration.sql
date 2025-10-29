-- Complete Migration for Server-Side Quota & Cooldown Enforcement
-- Run this entire file in Supabase SQL Editor

-- ============================================
-- Part 1: Ensure word_quota table exists
-- ============================================

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

-- Enable RLS and policy
ALTER TABLE word_quota ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to quota" ON word_quota;
CREATE POLICY "Allow all access to quota" ON word_quota 
  FOR ALL USING (true);

-- ============================================
-- Part 2: Create RPC Function
-- ============================================

CREATE OR REPLACE FUNCTION public.use_word_attempt(
  p_session_id UUID,
  p_user_hash TEXT,
  p_word TEXT
)
RETURNS TABLE(
  ok BOOLEAN,
  message TEXT,
  attempts_left INT,
  cooldown_remaining_seconds INT
) 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
DECLARE
  q_record RECORD;
  remaining INT := 3;
  cool_until TIMESTAMPTZ;
  cool_left INT := 0;
  session_grouping BOOLEAN;
  cluster_key_val TEXT;
  session_exists BOOLEAN;
BEGIN
  -- Check if session exists and is live
  SELECT EXISTS(SELECT 1 FROM wordcloud_sessions WHERE id = p_session_id AND status = 'live')
  INTO session_exists;
  
  IF NOT session_exists THEN
    RETURN QUERY SELECT 
      false::BOOLEAN AS ok,
      'Session not found or not live'::TEXT AS message,
      NULL::INT AS attempts_left,
      NULL::INT AS cooldown_remaining_seconds;
    RETURN;
  END IF;

  -- Ensure quota row exists
  INSERT INTO word_quota(session_id, user_hash, attempts_left)
  VALUES (p_session_id, p_user_hash, 3)
  ON CONFLICT (session_id, user_hash) DO NOTHING;

  -- Get current quota and cooldown status
  SELECT attempts_left, cooldown_until INTO q_record
  FROM word_quota 
  WHERE session_id = p_session_id AND user_hash = p_user_hash;

  remaining := COALESCE(q_record.attempts_left, 3);
  cool_until := q_record.cooldown_until;

  -- Check if user is in cooldown
  IF cool_until IS NOT NULL AND cool_until > NOW() THEN
    cool_left := EXTRACT(EPOCH FROM (cool_until - NOW()))::INT;
    RETURN QUERY SELECT 
      false::BOOLEAN AS ok,
      'COOLDOWN'::TEXT AS message,
      remaining AS attempts_left,
      cool_left AS cooldown_remaining_seconds;
    RETURN;
  END IF;

  -- If user has no attempts left but cooldown expired (or never set), reset attempts
  IF remaining <= 0 THEN
    UPDATE word_quota
    SET attempts_left = 3, cooldown_until = NULL, updated_at = NOW()
    WHERE session_id = p_session_id AND user_hash = p_user_hash;
    remaining := 3;
  END IF;

  -- Check if user has attempts left
  IF remaining <= 0 THEN
    RETURN QUERY SELECT 
      false::BOOLEAN AS ok,
      'No attempts left'::TEXT AS message,
      remaining AS attempts_left,
      cool_left AS cooldown_remaining_seconds;
    RETURN;
  END IF;

  -- Get session grouping setting
  SELECT grouping_enabled INTO session_grouping
  FROM wordcloud_sessions
  WHERE id = p_session_id;

  -- For now, use word as cluster key (we can enhance this later)
  cluster_key_val := LOWER(TRIM(p_word));

  -- Insert the submission
  INSERT INTO wordcloud_entries(
    session_id, 
    user_hash, 
    word_raw, 
    word_norm, 
    cluster_key,
    is_blocked
  )
  VALUES (
    p_session_id, 
    p_user_hash, 
    p_word, 
    cluster_key_val, 
    cluster_key_val,
    false
  );

  -- Decrement one attempt
  UPDATE word_quota
  SET attempts_left = attempts_left - 1, updated_at = NOW()
  WHERE session_id = p_session_id AND user_hash = p_user_hash
  RETURNING attempts_left INTO remaining;

  -- Update summary
  INSERT INTO wordcloud_summary(session_id, cluster_key, display_word, count)
  VALUES (p_session_id, cluster_key_val, cluster_key_val, 1)
  ON CONFLICT (session_id, cluster_key)
  DO UPDATE SET count = wordcloud_summary.count + 1, updated_at = NOW();

  -- If no attempts left, start cooldown
  IF remaining = 0 THEN
    UPDATE word_quota
    SET cooldown_until = NOW() + INTERVAL '1 hour', updated_at = NOW()
    WHERE session_id = p_session_id AND user_hash = p_user_hash;
  END IF;

  -- Return success
  RETURN QUERY SELECT 
    true::BOOLEAN AS ok,
    'OK'::TEXT AS message,
    remaining AS attempts_left,
    0 AS cooldown_remaining_seconds;

EXCEPTION WHEN OTHERS THEN
  -- Return error if something goes wrong
  RETURN QUERY SELECT 
    false::BOOLEAN AS ok,
    'ERROR: ' || SQLERRM::TEXT AS message,
    NULL::INT AS attempts_left,
    NULL::INT AS cooldown_remaining_seconds;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.use_word_attempt(UUID, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.use_word_attempt(UUID, TEXT, TEXT) TO authenticated;


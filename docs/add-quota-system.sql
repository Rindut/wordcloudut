-- Add per-user quota system for word submissions
-- This adds quota tracking and cooldown enforcement at the database level

-- Create quota tracking table
CREATE TABLE IF NOT EXISTS public.word_quota (
  session_id UUID NOT NULL REFERENCES public.wordcloud_sessions(id) ON DELETE CASCADE,
  user_hash TEXT NOT NULL, -- Note: using user_hash instead of auth.uid() since we're not using auth
  attempts_left INTEGER NOT NULL DEFAULT 3,
  cooldown_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY(session_id, user_hash)
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_quota_session_user ON public.word_quota(session_id, user_hash);

-- Add updated_at trigger
CREATE TRIGGER IF NOT EXISTS update_quota_updated_at
  BEFORE UPDATE ON public.word_quota
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (but allow all for now since we're using user_hash instead of auth)
ALTER TABLE public.word_quota ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow all access to quota" ON public.word_quota 
  FOR ALL USING (true);

-- RPC Function: use_word_attempt
-- Enforces quota and cooldown at the database level
CREATE OR REPLACE FUNCTION public.use_word_attempt(
  p_session UUID,
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
  remaining INT := 0;
  cool_until TIMESTAMPTZ;
  cool_left INT := 0;
  normalized_word TEXT;
  cluster_key_val TEXT;
  session_grouping BOOLEAN;
BEGIN
  -- Ensure quota row exists
  INSERT INTO public.word_quota(session_id, user_hash)
  VALUES (p_session, p_user_hash)
  ON CONFLICT (session_id, user_hash) DO NOTHING;

  -- Get current quota and cooldown status
  SELECT attempts_left, cooldown_until INTO q_record
  FROM public.word_quota 
  WHERE session_id = p_session AND user_hash = p_user_hash;

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
    UPDATE public.word_quota
    SET attempts_left = 3, cooldown_until = NULL, updated_at = NOW()
    WHERE session_id = p_session AND user_hash = p_user_hash;
    remaining := 3;
  END IF;

  -- Check if session exists and get grouping setting
  SELECT grouping_enabled INTO session_grouping
  FROM wordcloud_sessions
  WHERE id = p_session;

  -- Normalize the word (similar to what's done in the API)
  -- This is a simplified version - you may want to call the actual normalization function
  normalized_word := LOWER(TRIM(p_word));
  
  -- Generate cluster key (simplified - you may want to implement actual clustering)
  cluster_key_val := COALESCE(session_grouping, false)::BOOLEAN 
    ? normalized_word 
    : normalized_word;

  -- Insert the submission
  INSERT INTO public.wordcloud_entries(
    session_id, 
    user_hash, 
    word_raw, 
    word_norm, 
    cluster_key,
    is_blocked
  )
  VALUES (
    p_session, 
    p_user_hash, 
    p_word, 
    normalized_word, 
    cluster_key_val,
    false
  );

  -- Decrement one attempt
  UPDATE public.word_quota
  SET attempts_left = attempts_left - 1, updated_at = NOW()
  WHERE session_id = p_session AND user_hash = p_user_hash
  RETURNING attempts_left INTO remaining;

  -- If no attempts left, start cooldown
  IF remaining = 0 THEN
    UPDATE public.word_quota
    SET cooldown_until = NOW() + INTERVAL '1 hour', updated_at = NOW()
    WHERE session_id = p_session AND user_hash = p_user_hash;
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

-- Add cooldown_hours column to wordcloud_sessions if it doesn't exist
-- This allows admins to configure cooldown duration per session
ALTER TABLE public.wordcloud_sessions 
  ADD COLUMN IF NOT EXISTS cooldown_hours INTEGER DEFAULT 1;




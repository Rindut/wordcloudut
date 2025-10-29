-- Install RPC Function for PRDv3 (30 minute cooldown)
-- Copy this to Supabase SQL Editor and Run

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
  cluster_key_val TEXT;
  session_exists BOOLEAN;
  session_max_entries INT := 3;
  session_cooldown_minutes INT := 30;
BEGIN
  -- Get session config (max_entries_per_user and cooldown_hours)
  SELECT max_entries_per_user, cooldown_hours
  INTO session_max_entries, session_cooldown_minutes
  FROM wordcloud_sessions
  WHERE id = p_session_id;
  
  -- If session not found or values are NULL, use defaults
  IF session_max_entries IS NULL THEN
    session_max_entries := 3;
  END IF;
  IF session_cooldown_minutes IS NULL THEN
    session_cooldown_minutes := 30;
  END IF;
  
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

  -- Validate word (1-10 chars, letters only)
  IF length(trim(p_word)) < 1 OR length(trim(p_word)) > 10 THEN
    RETURN QUERY SELECT 
      false::BOOLEAN AS ok,
      'Word must be 1-10 characters'::TEXT AS message,
      NULL::INT AS attempts_left,
      NULL::INT AS cooldown_remaining_seconds;
    RETURN;
  END IF;

  IF NOT (p_word ~ '^[a-zA-Z\s]+$') THEN
    RETURN QUERY SELECT 
      false::BOOLEAN AS ok,
      'Word must contain only letters'::TEXT AS message,
      NULL::INT AS attempts_left,
      NULL::INT AS cooldown_remaining_seconds;
    RETURN;
  END IF;

  -- Ensure quota row exists
  INSERT INTO word_quota(session_id, user_hash, attempts_left)
  VALUES (p_session_id, p_user_hash, session_max_entries)
  ON CONFLICT (session_id, user_hash) DO NOTHING;

  -- Get current quota and cooldown status
  SELECT q.attempts_left, q.cooldown_until INTO q_record
  FROM word_quota q
  WHERE q.session_id = p_session_id AND q.user_hash = p_user_hash;

  remaining := COALESCE(q_record.attempts_left, session_max_entries);
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
    UPDATE word_quota q
    SET attempts_left = session_max_entries, cooldown_until = NULL, updated_at = NOW()
    WHERE q.session_id = p_session_id AND q.user_hash = p_user_hash;
    remaining := session_max_entries;
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

  -- Normalize word (lowercase, trim)
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
  UPDATE word_quota q
  SET attempts_left = q.attempts_left - 1, updated_at = NOW()
  WHERE q.session_id = p_session_id AND q.user_hash = p_user_hash
  RETURNING q.attempts_left INTO remaining;

  -- Update summary
  INSERT INTO wordcloud_summary(session_id, cluster_key, display_word, count)
  VALUES (p_session_id, cluster_key_val, cluster_key_val, 1)
  ON CONFLICT (session_id, cluster_key)
  DO UPDATE SET count = wordcloud_summary.count + 1, updated_at = NOW();

  -- If no attempts left, start cooldown (use session_cooldown_minutes)
  IF remaining = 0 THEN
    UPDATE word_quota q
    SET cooldown_until = NOW() + (session_cooldown_minutes || ' minutes')::INTERVAL, updated_at = NOW()
    WHERE q.session_id = p_session_id AND q.user_hash = p_user_hash;
    cool_left := session_cooldown_minutes * 60; -- Convert minutes to seconds
  END IF;

  -- Return success
  RETURN QUERY SELECT 
    true::BOOLEAN AS ok,
    'OK'::TEXT AS message,
    remaining AS attempts_left,
    cool_left AS cooldown_remaining_seconds;

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


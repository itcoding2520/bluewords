DO $$
DECLARE
  has_legacy_12_pair_sessions boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.vocabulary_game_sessions
    WHERE game_type = 'word-match' AND round_size = 12
  ) INTO has_legacy_12_pair_sessions;

  ALTER TABLE public.vocabulary_game_sessions
    DROP CONSTRAINT IF EXISTS vocabulary_game_sessions_round_size_score_check;

  IF has_legacy_12_pair_sessions THEN
    -- Keep any already-saved 12-pair result readable, but no new 12-pair games can be saved.
    ALTER TABLE public.vocabulary_game_sessions
      ADD CONSTRAINT vocabulary_game_sessions_round_size_score_check
      CHECK (
        (game_type = 'word-match' AND round_size IN (6, 8, 10, 12) AND score = correct_count * 10)
        OR
        (game_type = 'word-scramble' AND round_size IN (5, 10) AND score BETWEEN correct_count * 10 AND correct_count * 20)
      );
  ELSE
    ALTER TABLE public.vocabulary_game_sessions
      ADD CONSTRAINT vocabulary_game_sessions_round_size_score_check
      CHECK (
        (game_type = 'word-match' AND round_size IN (6, 8, 10) AND score = correct_count * 10)
        OR
        (game_type = 'word-scramble' AND round_size IN (5, 10) AND score BETWEEN correct_count * 10 AND correct_count * 20)
      );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_vocabulary_game_session(
  p_game_type text,
  p_round_size integer,
  p_score integer,
  p_correct_count integer,
  p_moves integer,
  p_duration_seconds integer,
  p_started_at timestamptz,
  p_completed_at timestamptz
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_session_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to save game results.';
  END IF;

  IF p_game_type IS NULL
    OR p_game_type NOT IN ('word-match', 'word-scramble')
    OR p_round_size IS NULL
    OR p_score IS NULL
    OR p_score < 0
    OR p_correct_count IS NULL
    OR p_correct_count <> p_round_size
    OR p_moves IS NULL
    OR p_moves < p_correct_count
    OR p_duration_seconds IS NULL
    OR p_duration_seconds < 0
    OR p_started_at IS NULL
    OR p_completed_at IS NULL
    OR p_completed_at < p_started_at
    OR NOT (
      (p_game_type = 'word-match' AND p_round_size IN (6, 8, 10) AND p_score = p_correct_count * 10)
      OR
      (p_game_type = 'word-scramble' AND p_round_size IN (5, 10) AND p_score BETWEEN p_correct_count * 10 AND p_correct_count * 20)
    )
  THEN
    RAISE EXCEPTION 'Invalid vocabulary game session data.';
  END IF;

  INSERT INTO public.vocabulary_game_sessions (
    user_id, game_type, round_size, score, correct_count, moves,
    duration_seconds, started_at, completed_at
  ) VALUES (
    v_user_id, p_game_type, p_round_size, p_score, p_correct_count, p_moves,
    p_duration_seconds, p_started_at, p_completed_at
  ) RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$;

REVOKE ALL PRIVILEGES
  ON FUNCTION public.save_vocabulary_game_session(text, integer, integer, integer, integer, integer, timestamptz, timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE
  ON FUNCTION public.save_vocabulary_game_session(text, integer, integer, integer, integer, integer, timestamptz, timestamptz)
  TO authenticated;

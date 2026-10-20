ALTER TABLE public.word_search_sessions
  DROP CONSTRAINT IF EXISTS word_search_sessions_grid_size_check,
  ADD CONSTRAINT word_search_sessions_grid_size_check
    CHECK (grid_size IN (10, 15, 20, 30));

DROP POLICY IF EXISTS "Users can add own word search sessions"
  ON public.word_search_sessions;

CREATE POLICY "Users can add own word search sessions"
  ON public.word_search_sessions
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND grid_size IN (10, 15, 20, 30)
    AND difficulty IN ('easy', 'medium', 'hard')
    AND word_count > 0
    AND duration_seconds >= 0
    AND completed_at >= started_at
  );

CREATE OR REPLACE FUNCTION public.save_word_search_session(
  p_grid_size integer,
  p_difficulty text,
  p_category text,
  p_word_count integer,
  p_duration_seconds integer,
  p_words jsonb,
  p_started_at timestamptz,
  p_completed_at timestamptz
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_session_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to save word search history.';
  END IF;

  IF p_grid_size IS NULL
    OR p_grid_size NOT IN (10, 15, 20, 30)
    OR p_difficulty IS NULL
    OR p_difficulty NOT IN ('easy', 'medium', 'hard')
    OR p_category IS NULL
    OR length(btrim(p_category)) NOT BETWEEN 1 AND 100
    OR p_word_count IS NULL
    OR p_word_count <= 0
    OR p_duration_seconds IS NULL
    OR p_duration_seconds < 0
    OR p_words IS NULL
    OR jsonb_typeof(p_words) <> 'array'
    OR jsonb_array_length(p_words) <> p_word_count
    OR p_started_at IS NULL
    OR p_completed_at IS NULL
    OR p_completed_at < p_started_at
  THEN
    RAISE EXCEPTION 'Invalid word search session data.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_words) AS word(value)
    WHERE jsonb_typeof(word.value) <> 'string' OR length(btrim(word.value #>> '{}')) = 0
  ) THEN
    RAISE EXCEPTION 'Word search history words must be non-empty strings.';
  END IF;

  INSERT INTO public.word_search_sessions (
    user_id, grid_size, difficulty, category, word_count, duration_seconds, words, started_at, completed_at
  ) VALUES (
    v_user_id, p_grid_size, p_difficulty, btrim(p_category), p_word_count, p_duration_seconds, p_words, p_started_at, p_completed_at
  ) RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$;

REVOKE ALL PRIVILEGES
  ON FUNCTION public.save_word_search_session(integer, text, text, integer, integer, jsonb, timestamptz, timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE
  ON FUNCTION public.save_word_search_session(integer, text, text, integer, integer, jsonb, timestamptz, timestamptz)
  TO authenticated;

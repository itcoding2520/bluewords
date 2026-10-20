CREATE TABLE public.word_search_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grid_size integer NOT NULL CHECK (grid_size IN (10, 20, 30)),
  difficulty text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  category text NOT NULL CHECK (length(btrim(category)) BETWEEN 1 AND 100),
  word_count integer NOT NULL CHECK (word_count > 0),
  duration_seconds integer NOT NULL CHECK (duration_seconds >= 0),
  words jsonb NOT NULL CHECK (jsonb_typeof(words) = 'array'),
  started_at timestamptz NOT NULL,
  completed_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (completed_at >= started_at),
  CHECK (jsonb_array_length(words) = word_count)
);

CREATE INDEX word_search_sessions_user_completed_idx
  ON public.word_search_sessions (user_id, completed_at DESC, id DESC);

ALTER TABLE public.word_search_sessions ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.word_search_sessions FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.word_search_sessions TO authenticated;

CREATE POLICY "Users can view own word search sessions"
  ON public.word_search_sessions
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can add own word search sessions"
  ON public.word_search_sessions
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND grid_size IN (10, 20, 30)
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
    OR p_grid_size NOT IN (10, 20, 30)
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

CREATE INDEX vocabulary_quiz_sessions_leaderboard_idx
  ON public.vocabulary_quiz_sessions (
    mode,
    question_count,
    correct_count DESC,
    duration_seconds ASC,
    completed_at ASC,
    id ASC
  );

CREATE INDEX word_search_sessions_leaderboard_idx
  ON public.word_search_sessions (
    grid_size,
    difficulty,
    category,
    duration_seconds ASC,
    completed_at ASC,
    id ASC
  );

CREATE OR REPLACE FUNCTION public.get_vocabulary_quiz_leaderboard(
  p_mode text,
  p_question_count integer,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  rank_position bigint,
  player_name text,
  correct_count integer,
  question_count integer,
  duration_seconds integer,
  is_you boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to view game leaderboards.';
  END IF;

  IF p_mode IS NULL
    OR p_mode NOT IN ('type-word', 'choose-meaning')
    OR p_question_count IS NULL
    OR p_question_count NOT IN (10, 20, 30)
    OR p_limit IS NULL
    OR p_limit NOT BETWEEN 1 AND 100
  THEN
    RAISE EXCEPTION 'Invalid quiz leaderboard filters.';
  END IF;

  RETURN QUERY
  WITH personal_best AS (
    SELECT
      s.user_id,
      s.correct_count,
      s.question_count,
      s.duration_seconds,
      s.completed_at,
      s.id,
      row_number() OVER (
        PARTITION BY s.user_id
        ORDER BY s.correct_count DESC, s.duration_seconds ASC, s.completed_at ASC, s.id ASC
      ) AS personal_rank
    FROM public.vocabulary_quiz_sessions AS s
    WHERE s.mode = p_mode
      AND s.question_count = p_question_count
  ),
  ranked AS (
    SELECT
      row_number() OVER (
        ORDER BY best.correct_count DESC, best.duration_seconds ASC, best.completed_at ASC, best.id ASC
      ) AS rank_position,
      'Player-' || upper(substr(pg_catalog.md5(best.user_id::text), 1, 6)) AS player_name,
      best.correct_count,
      best.question_count,
      best.duration_seconds,
      best.user_id = auth.uid() AS is_you
    FROM personal_best AS best
    WHERE best.personal_rank = 1
  )
  SELECT ranked.rank_position, ranked.player_name, ranked.correct_count,
    ranked.question_count, ranked.duration_seconds, ranked.is_you
  FROM ranked
  WHERE ranked.rank_position <= p_limit OR ranked.is_you
  ORDER BY ranked.rank_position;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_word_search_leaderboard(
  p_grid_size integer,
  p_difficulty text,
  p_category text DEFAULT NULL,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  rank_position bigint,
  player_name text,
  category text,
  word_count integer,
  duration_seconds integer,
  is_you boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to view game leaderboards.';
  END IF;

  IF p_grid_size IS NULL
    OR p_grid_size NOT IN (10, 15, 20)
    OR p_difficulty IS NULL
    OR p_difficulty NOT IN ('easy', 'medium', 'hard')
    OR (p_category IS NOT NULL AND length(btrim(p_category)) NOT BETWEEN 1 AND 100)
    OR p_limit IS NULL
    OR p_limit NOT BETWEEN 1 AND 100
  THEN
    RAISE EXCEPTION 'Invalid word search leaderboard filters.';
  END IF;

  RETURN QUERY
  WITH personal_best AS (
    SELECT
      s.user_id,
      s.category,
      s.word_count,
      s.duration_seconds,
      s.completed_at,
      s.id,
      row_number() OVER (
        PARTITION BY s.user_id
        ORDER BY s.duration_seconds ASC, s.word_count DESC, s.completed_at ASC, s.id ASC
      ) AS personal_rank
    FROM public.word_search_sessions AS s
    WHERE s.grid_size = p_grid_size
      AND s.difficulty = p_difficulty
      AND (p_category IS NULL OR s.category = p_category)
  ),
  ranked AS (
    SELECT
      row_number() OVER (
        ORDER BY best.duration_seconds ASC, best.word_count DESC, best.completed_at ASC, best.id ASC
      ) AS rank_position,
      'Player-' || upper(substr(pg_catalog.md5(best.user_id::text), 1, 6)) AS player_name,
      best.category,
      best.word_count,
      best.duration_seconds,
      best.user_id = auth.uid() AS is_you
    FROM personal_best AS best
    WHERE best.personal_rank = 1
  )
  SELECT ranked.rank_position, ranked.player_name, ranked.category,
    ranked.word_count, ranked.duration_seconds, ranked.is_you
  FROM ranked
  WHERE ranked.rank_position <= p_limit OR ranked.is_you
  ORDER BY ranked.rank_position;
END;
$$;

REVOKE ALL PRIVILEGES
  ON FUNCTION public.get_vocabulary_quiz_leaderboard(text, integer, integer),
    public.get_word_search_leaderboard(integer, text, text, integer)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE
  ON FUNCTION public.get_vocabulary_quiz_leaderboard(text, integer, integer),
    public.get_word_search_leaderboard(integer, text, text, integer)
  TO authenticated;

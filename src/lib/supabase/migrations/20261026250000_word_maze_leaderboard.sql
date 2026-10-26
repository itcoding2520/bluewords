ALTER TABLE public.vocabulary_game_sessions
  DROP CONSTRAINT IF EXISTS vocabulary_game_sessions_game_type_check;
ALTER TABLE public.vocabulary_game_sessions
  ADD CONSTRAINT vocabulary_game_sessions_game_type_check
  CHECK (game_type IN ('word-match', 'word-scramble', 'word-maze'));

DO $$
DECLARE
  has_legacy_12_pair_sessions boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.vocabulary_game_sessions
    WHERE game_type = 'word-match' AND round_size = 12
  ) INTO has_legacy_12_pair_sessions;

  ALTER TABLE public.vocabulary_game_sessions
    DROP CONSTRAINT IF EXISTS vocabulary_game_sessions_round_size_score_check;

  IF has_legacy_12_pair_sessions THEN
    ALTER TABLE public.vocabulary_game_sessions
      ADD CONSTRAINT vocabulary_game_sessions_round_size_score_check
      CHECK (
        (game_type = 'word-match' AND round_size IN (6, 8, 10, 12) AND score = correct_count * 10)
        OR
        (game_type = 'word-scramble' AND round_size IN (5, 10) AND score BETWEEN correct_count * 10 AND correct_count * 20)
        OR
        (game_type = 'word-maze' AND round_size = 5 AND score = correct_count * 10)
      );
  ELSE
    ALTER TABLE public.vocabulary_game_sessions
      ADD CONSTRAINT vocabulary_game_sessions_round_size_score_check
      CHECK (
        (game_type = 'word-match' AND round_size IN (6, 8, 10) AND score = correct_count * 10)
        OR
        (game_type = 'word-scramble' AND round_size IN (5, 10) AND score BETWEEN correct_count * 10 AND correct_count * 20)
        OR
        (game_type = 'word-maze' AND round_size = 5 AND score = correct_count * 10)
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
    OR p_game_type NOT IN ('word-match', 'word-scramble', 'word-maze')
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
      OR
      (p_game_type = 'word-maze' AND p_round_size = 5 AND p_score = p_correct_count * 10)
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

CREATE OR REPLACE FUNCTION public.get_vocabulary_game_leaderboard(
  p_game_type text,
  p_round_size integer,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  rank_position bigint,
  player_name text,
  avatar_path text,
  game_type text,
  round_size integer,
  score integer,
  correct_count integer,
  moves integer,
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

  IF p_game_type IS NULL
    OR p_game_type NOT IN ('word-match', 'word-scramble', 'word-maze')
    OR (p_round_size IS NOT NULL AND NOT (
      (p_game_type = 'word-match' AND p_round_size IN (6, 8, 10, 12))
      OR (p_game_type = 'word-scramble' AND p_round_size IN (5, 10))
      OR (p_game_type = 'word-maze' AND p_round_size = 5)
    ))
    OR p_limit IS NULL
    OR p_limit NOT BETWEEN 1 AND 100
  THEN
    RAISE EXCEPTION 'Invalid vocabulary game leaderboard filters.';
  END IF;

  RETURN QUERY
  WITH personal_best AS (
    SELECT s.user_id, s.game_type, s.round_size, s.score, s.correct_count,
      s.moves, s.duration_seconds, s.completed_at, s.id,
      row_number() OVER (
        PARTITION BY s.user_id
        ORDER BY s.score DESC, s.duration_seconds ASC, s.moves ASC, s.completed_at ASC, s.id ASC
      ) AS personal_rank
    FROM public.vocabulary_game_sessions AS s
    WHERE s.game_type = p_game_type
      AND (p_round_size IS NULL OR s.round_size = p_round_size)
  ),
  ranked AS (
    SELECT
      row_number() OVER (
        ORDER BY best.score DESC, best.duration_seconds ASC, best.moves ASC, best.completed_at ASC, best.id ASC
      ) AS rank_position,
      COALESCE(profile.nickname, 'Player-' || upper(substr(pg_catalog.md5(best.user_id::text), 1, 6))) AS player_name,
      profile.avatar_path,
      best.game_type,
      best.round_size,
      best.score,
      best.correct_count,
      best.moves,
      best.duration_seconds,
      best.user_id = auth.uid() AS is_you
    FROM personal_best AS best
    LEFT JOIN public.user_profiles AS profile ON profile.user_id = best.user_id
    WHERE best.personal_rank = 1
  )
  SELECT ranked.rank_position, ranked.player_name, ranked.avatar_path,
    ranked.game_type, ranked.round_size, ranked.score, ranked.correct_count,
    ranked.moves, ranked.duration_seconds, ranked.is_you
  FROM ranked
  WHERE ranked.rank_position <= p_limit OR ranked.is_you
  ORDER BY ranked.rank_position;
END;
$$;

REVOKE ALL PRIVILEGES
  ON FUNCTION public.save_vocabulary_game_session(text, integer, integer, integer, integer, integer, timestamptz, timestamptz),
    public.get_vocabulary_game_leaderboard(text, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE
  ON FUNCTION public.save_vocabulary_game_session(text, integer, integer, integer, integer, integer, timestamptz, timestamptz)
  TO authenticated;
GRANT EXECUTE
  ON FUNCTION public.get_vocabulary_game_leaderboard(text, integer, integer)
  TO authenticated;

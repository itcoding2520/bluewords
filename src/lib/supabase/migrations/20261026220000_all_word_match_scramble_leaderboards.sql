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
    OR p_game_type NOT IN ('word-match', 'word-scramble')
    OR (p_round_size IS NOT NULL AND NOT (
      (p_game_type = 'word-match' AND p_round_size IN (2, 4, 6, 8))
      OR (p_game_type = 'word-scramble' AND p_round_size IN (5, 10))
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
  ON FUNCTION public.get_vocabulary_game_leaderboard(text, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE
  ON FUNCTION public.get_vocabulary_game_leaderboard(text, integer, integer)
  TO authenticated;

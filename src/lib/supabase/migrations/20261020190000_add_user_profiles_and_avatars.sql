CREATE TABLE public.user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname text,
  avatar_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_profiles_nickname_check CHECK (
    nickname IS NULL OR (
      nickname = btrim(nickname)
      AND char_length(nickname) BETWEEN 2 AND 24
    )
  ),
  CONSTRAINT user_profiles_avatar_path_check CHECK (
    avatar_path IS NULL OR avatar_path LIKE user_id::text || '/%'
  )
);

CREATE UNIQUE INDEX user_profiles_nickname_lower_key
  ON public.user_profiles (lower(nickname))
  WHERE nickname IS NOT NULL;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.user_profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.user_profiles TO authenticated;
REVOKE TRUNCATE ON TABLE public.user_profiles FROM anon, authenticated;

CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create own profile"
  ON public.user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE FUNCTION public.set_user_profiles_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_profiles_updated_at();

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'user-avatars',
  'user-avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "Users can upload own avatar images"
  ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'user-avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

CREATE POLICY "Users can delete own avatar images"
  ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'user-avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP FUNCTION public.get_vocabulary_quiz_leaderboard(text, integer, integer);
DROP FUNCTION public.get_word_search_leaderboard(integer, text, text, integer);

CREATE FUNCTION public.get_vocabulary_quiz_leaderboard(
  p_mode text,
  p_question_count integer,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  rank_position bigint,
  player_name text,
  avatar_path text,
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
    SELECT s.user_id, s.correct_count, s.question_count, s.duration_seconds,
      s.completed_at, s.id,
      row_number() OVER (
        PARTITION BY s.user_id
        ORDER BY s.correct_count DESC, s.duration_seconds ASC, s.completed_at ASC, s.id ASC
      ) AS personal_rank
    FROM public.vocabulary_quiz_sessions AS s
    WHERE s.mode = p_mode AND s.question_count = p_question_count
  ),
  ranked AS (
    SELECT
      row_number() OVER (
        ORDER BY best.correct_count DESC, best.duration_seconds ASC, best.completed_at ASC, best.id ASC
      ) AS rank_position,
      COALESCE(profile.nickname, 'Player-' || upper(substr(pg_catalog.md5(best.user_id::text), 1, 6))) AS player_name,
      profile.avatar_path,
      best.correct_count,
      best.question_count,
      best.duration_seconds,
      best.user_id = auth.uid() AS is_you
    FROM personal_best AS best
    LEFT JOIN public.user_profiles AS profile ON profile.user_id = best.user_id
    WHERE best.personal_rank = 1
  )
  SELECT ranked.rank_position, ranked.player_name, ranked.avatar_path,
    ranked.correct_count, ranked.question_count, ranked.duration_seconds, ranked.is_you
  FROM ranked
  WHERE ranked.rank_position <= p_limit OR ranked.is_you
  ORDER BY ranked.rank_position;
END;
$$;

CREATE FUNCTION public.get_word_search_leaderboard(
  p_grid_size integer,
  p_difficulty text,
  p_category text DEFAULT NULL,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  rank_position bigint,
  player_name text,
  avatar_path text,
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
    SELECT s.user_id, s.category, s.word_count, s.duration_seconds, s.completed_at, s.id,
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
      COALESCE(profile.nickname, 'Player-' || upper(substr(pg_catalog.md5(best.user_id::text), 1, 6))) AS player_name,
      profile.avatar_path,
      best.category,
      best.word_count,
      best.duration_seconds,
      best.user_id = auth.uid() AS is_you
    FROM personal_best AS best
    LEFT JOIN public.user_profiles AS profile ON profile.user_id = best.user_id
    WHERE best.personal_rank = 1
  )
  SELECT ranked.rank_position, ranked.player_name, ranked.avatar_path,
    ranked.category, ranked.word_count, ranked.duration_seconds, ranked.is_you
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

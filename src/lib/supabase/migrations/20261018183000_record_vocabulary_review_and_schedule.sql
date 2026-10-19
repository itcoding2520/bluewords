-- Start existing review history with a one-day interval so prior outcomes are
-- preserved and older reviews are immediately eligible for review.
WITH latest_reviews AS (
  SELECT DISTINCT ON (user_id, vocabulary_word_id)
    user_id,
    vocabulary_word_id,
    reviewed_at,
    remembered
  FROM public.vocabulary_reviews
  ORDER BY user_id, vocabulary_word_id, reviewed_at DESC, id DESC
)
INSERT INTO public.vocabulary_review_schedule (
  user_id,
  vocabulary_word_id,
  due_at,
  interval_days,
  repetitions,
  last_reviewed_at,
  updated_at
)
SELECT
  user_id,
  vocabulary_word_id,
  reviewed_at + interval '1 day',
  1,
  CASE WHEN remembered THEN 1 ELSE 0 END,
  reviewed_at,
  now()
FROM latest_reviews
ON CONFLICT (user_id, vocabulary_word_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.record_vocabulary_review(
  p_vocabulary_word_id uuid,
  p_remembered boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_now timestamptz := now();
  v_previous_repetitions integer;
  v_next_repetitions integer;
  v_interval_days integer;
  v_review public.vocabulary_reviews%ROWTYPE;
  v_schedule public.vocabulary_review_schedule%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to record a vocabulary review.';
  END IF;

  IF p_remembered IS NULL THEN
    RAISE EXCEPTION 'A review outcome is required.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.vocabulary_words
    WHERE id = p_vocabulary_word_id
      AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Vocabulary word not found for this user.';
  END IF;

  INSERT INTO public.vocabulary_review_schedule (
    user_id,
    vocabulary_word_id,
    due_at,
    interval_days,
    repetitions,
    updated_at
  )
  VALUES (
    v_user_id,
    p_vocabulary_word_id,
    v_now,
    0,
    0,
    v_now
  )
  ON CONFLICT (user_id, vocabulary_word_id) DO NOTHING;

  SELECT repetitions
  INTO v_previous_repetitions
  FROM public.vocabulary_review_schedule
  WHERE user_id = v_user_id
    AND vocabulary_word_id = p_vocabulary_word_id
  FOR UPDATE;

  IF p_remembered THEN
    v_next_repetitions := v_previous_repetitions + 1;
    v_interval_days := CASE
      WHEN v_next_repetitions = 1 THEN 1
      WHEN v_next_repetitions = 2 THEN 3
      WHEN v_next_repetitions = 3 THEN 7
      WHEN v_next_repetitions = 4 THEN 14
      ELSE 30
    END;
  ELSE
    v_next_repetitions := 0;
    v_interval_days := 1;
  END IF;

  UPDATE public.vocabulary_review_schedule
  SET due_at = v_now + make_interval(days => v_interval_days),
      interval_days = v_interval_days,
      repetitions = v_next_repetitions,
      last_reviewed_at = v_now,
      updated_at = v_now
  WHERE user_id = v_user_id
    AND vocabulary_word_id = p_vocabulary_word_id
  RETURNING * INTO v_schedule;

  INSERT INTO public.vocabulary_reviews (
    user_id,
    vocabulary_word_id,
    remembered,
    reviewed_at
  )
  VALUES (
    v_user_id,
    p_vocabulary_word_id,
    p_remembered,
    v_now
  )
  RETURNING * INTO v_review;

  RETURN jsonb_build_object(
    'review', to_jsonb(v_review),
    'schedule', to_jsonb(v_schedule)
  );
END;
$$;

REVOKE ALL PRIVILEGES
  ON FUNCTION public.record_vocabulary_review(uuid, boolean)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE
  ON FUNCTION public.record_vocabulary_review(uuid, boolean)
  TO authenticated;

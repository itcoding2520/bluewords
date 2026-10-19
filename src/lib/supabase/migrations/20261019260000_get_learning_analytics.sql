CREATE OR REPLACE FUNCTION public.get_learning_analytics()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  WITH review_rows AS MATERIALIZED (
    SELECT review.remembered,
           (review.reviewed_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS review_date
    FROM public.vocabulary_reviews AS review
    WHERE review.user_id = (SELECT auth.uid())
  ),
  daily_counts AS (
    SELECT review_date, count(*) AS review_count
    FROM review_rows
    GROUP BY review_date
  ),
  today AS (
    SELECT (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS local_date
  ),
  streak_anchor AS (
    SELECT CASE
      WHEN EXISTS (
        SELECT 1 FROM daily_counts
        WHERE review_date = today.local_date
      ) THEN today.local_date
      WHEN EXISTS (
        SELECT 1 FROM daily_counts
        WHERE review_date = today.local_date - 1
      ) THEN today.local_date - 1
      ELSE NULL
    END AS anchor_date
    FROM today
  ),
  streak_candidates AS (
    SELECT daily.review_date,
           anchor.anchor_date
             - (row_number() OVER (ORDER BY daily.review_date DESC) - 1)::integer AS expected_date
    FROM daily_counts AS daily
    CROSS JOIN streak_anchor AS anchor
    WHERE anchor.anchor_date IS NOT NULL
      AND daily.review_date <= anchor.anchor_date
  ),
  streak AS (
    SELECT count(*) FILTER (WHERE review_date = expected_date)::integer AS current_streak
    FROM streak_candidates
  ),
  stats AS (
    SELECT count(*) AS total_reviews,
           count(*) FILTER (WHERE remembered) AS remembered_reviews
    FROM review_rows
  ),
  weekly_activity AS (
    SELECT coalesce(
      jsonb_agg(
        jsonb_build_object(
          'date', (today.local_date - days.day_offset)::text,
          'count', coalesce(daily.review_count, 0)
        ) ORDER BY days.day_offset DESC
      ),
      '[]'::jsonb
    ) AS daily_activity
    FROM today
    CROSS JOIN generate_series(0, 6) AS days(day_offset)
    LEFT JOIN daily_counts AS daily
      ON daily.review_date = today.local_date - days.day_offset
  )
  SELECT jsonb_build_object(
    'totalReviews', stats.total_reviews,
    'rememberedReviews', stats.remembered_reviews,
    'currentStreak', coalesce(streak.current_streak, 0),
    'dailyActivity', weekly_activity.daily_activity
  )
  FROM stats
  CROSS JOIN streak
  CROSS JOIN weekly_activity;
$$;

REVOKE ALL PRIVILEGES
  ON FUNCTION public.get_learning_analytics()
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE
  ON FUNCTION public.get_learning_analytics()
  TO authenticated;

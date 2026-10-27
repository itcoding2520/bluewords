DROP FUNCTION IF EXISTS public.get_latest_vocabulary_reviews();

CREATE FUNCTION public.get_latest_vocabulary_reviews()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  vocabulary_word_id uuid,
  remembered boolean,
  reviewed_at timestamptz,
  word text,
  meaning text,
  category text,
  status text
)
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT latest.id,
         latest.user_id,
         latest.vocabulary_word_id,
         latest.remembered,
         latest.reviewed_at,
         latest.word,
         latest.meaning,
         latest.category,
         latest.status
  FROM (
    SELECT DISTINCT ON (review.vocabulary_word_id)
           review.id,
           review.user_id,
           review.vocabulary_word_id,
           review.remembered,
           review.reviewed_at,
           word.word,
           word.meaning,
           word.category,
           word.status
    FROM public.vocabulary_reviews AS review
    JOIN public.vocabulary_words AS word
      ON word.id = review.vocabulary_word_id
    WHERE review.user_id = (SELECT auth.uid())
    ORDER BY review.vocabulary_word_id,
             review.reviewed_at DESC,
             review.id DESC
  ) AS latest
  ORDER BY latest.reviewed_at DESC, latest.id DESC;
$$;

REVOKE ALL PRIVILEGES
  ON FUNCTION public.get_latest_vocabulary_reviews()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE
  ON FUNCTION public.get_latest_vocabulary_reviews()
  TO authenticated;

DROP FUNCTION IF EXISTS public.get_latest_vocabulary_review_counts();

CREATE FUNCTION public.get_latest_vocabulary_review_counts()
RETURNS TABLE (
  status text,
  review_count bigint
)
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  WITH latest AS (
    SELECT DISTINCT ON (review.vocabulary_word_id)
           word.status
    FROM public.vocabulary_reviews AS review
    JOIN public.vocabulary_words AS word
      ON word.id = review.vocabulary_word_id
    WHERE review.user_id = (SELECT auth.uid())
    ORDER BY review.vocabulary_word_id,
             review.reviewed_at DESC,
             review.id DESC
  )
  SELECT latest.status, count(*) AS review_count
  FROM latest
  GROUP BY latest.status;
$$;

REVOKE ALL PRIVILEGES
  ON FUNCTION public.get_latest_vocabulary_review_counts()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE
  ON FUNCTION public.get_latest_vocabulary_review_counts()
  TO authenticated;

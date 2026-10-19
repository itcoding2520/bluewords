CREATE OR REPLACE FUNCTION public.get_latest_vocabulary_review_counts()
RETURNS TABLE (
  remembered boolean,
  review_count bigint
)
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  WITH latest AS (
    SELECT DISTINCT ON (review.vocabulary_word_id)
           review.remembered
    FROM public.vocabulary_reviews AS review
    JOIN public.vocabulary_words AS word
      ON word.id = review.vocabulary_word_id
    WHERE review.user_id = (SELECT auth.uid())
    ORDER BY review.vocabulary_word_id,
             review.reviewed_at DESC,
             review.id DESC
  )
  SELECT latest.remembered, count(*) AS review_count
  FROM latest
  GROUP BY latest.remembered;
$$;

REVOKE ALL PRIVILEGES
  ON FUNCTION public.get_latest_vocabulary_review_counts()
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE
  ON FUNCTION public.get_latest_vocabulary_review_counts()
  TO authenticated;

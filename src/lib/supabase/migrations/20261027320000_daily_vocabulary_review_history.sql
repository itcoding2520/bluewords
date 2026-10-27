CREATE OR REPLACE FUNCTION public.get_vocabulary_review_history()
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
  SELECT review.id,
         review.user_id,
         review.vocabulary_word_id,
         review.remembered,
         review.reviewed_at,
         word.word,
         word.meaning,
         word.category,
         CASE WHEN review.remembered THEN 'mastered' ELSE 'learning' END
  FROM public.vocabulary_reviews AS review
  JOIN public.vocabulary_words AS word
    ON word.id = review.vocabulary_word_id
  WHERE review.user_id = (SELECT auth.uid())
  ORDER BY review.reviewed_at DESC, review.id DESC;
$$;

REVOKE ALL PRIVILEGES
  ON FUNCTION public.get_vocabulary_review_history()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE
  ON FUNCTION public.get_vocabulary_review_history()
  TO authenticated;

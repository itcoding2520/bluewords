CREATE TABLE public.vocabulary_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL
    REFERENCES auth.users(id) ON DELETE CASCADE,
  vocabulary_word_id uuid NOT NULL
    REFERENCES public.vocabulary_words(id) ON DELETE CASCADE,
  remembered boolean NOT NULL,
  reviewed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX vocabulary_reviews_user_reviewed_at_idx
  ON public.vocabulary_reviews (user_id, reviewed_at DESC);

CREATE INDEX vocabulary_reviews_word_reviewed_at_idx
  ON public.vocabulary_reviews (vocabulary_word_id, reviewed_at DESC);

ALTER TABLE public.vocabulary_reviews ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES
  ON TABLE public.vocabulary_reviews
  FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT
  ON TABLE public.vocabulary_reviews
  TO authenticated;

REVOKE TRUNCATE
  ON TABLE public.vocabulary_reviews
  FROM anon, authenticated;

CREATE POLICY "Users can view own vocabulary reviews"
  ON public.vocabulary_reviews
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert reviews for own vocabulary"
  ON public.vocabulary_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.vocabulary_words
      WHERE vocabulary_words.id = vocabulary_word_id
        AND vocabulary_words.user_id = (SELECT auth.uid())
    )
  );

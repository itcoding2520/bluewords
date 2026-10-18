CREATE TABLE public.vocabulary_review_schedule (
  user_id uuid NOT NULL
    REFERENCES auth.users(id) ON DELETE CASCADE,
  vocabulary_word_id uuid NOT NULL
    REFERENCES public.vocabulary_words(id) ON DELETE CASCADE,
  due_at timestamptz NOT NULL DEFAULT now(),
  interval_days integer NOT NULL DEFAULT 0
    CHECK (interval_days >= 0),
  repetitions integer NOT NULL DEFAULT 0
    CHECK (repetitions >= 0),
  last_reviewed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, vocabulary_word_id)
);

CREATE INDEX vocabulary_review_schedule_user_due_at_idx
  ON public.vocabulary_review_schedule (user_id, due_at ASC);

ALTER TABLE public.vocabulary_review_schedule ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES
  ON TABLE public.vocabulary_review_schedule
  FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE
  ON TABLE public.vocabulary_review_schedule
  TO authenticated;

REVOKE TRUNCATE
  ON TABLE public.vocabulary_review_schedule
  FROM anon, authenticated;

CREATE POLICY "Users can view own vocabulary review schedules"
  ON public.vocabulary_review_schedule
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create schedules for own vocabulary"
  ON public.vocabulary_review_schedule
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

CREATE POLICY "Users can update schedules for own vocabulary"
  ON public.vocabulary_review_schedule
  FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.vocabulary_words
      WHERE vocabulary_words.id = vocabulary_word_id
        AND vocabulary_words.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.vocabulary_words
      WHERE vocabulary_words.id = vocabulary_word_id
        AND vocabulary_words.user_id = (SELECT auth.uid())
    )
  );

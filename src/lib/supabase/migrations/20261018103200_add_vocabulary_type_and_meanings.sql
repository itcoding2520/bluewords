ALTER TABLE public.vocabulary_words
  ADD COLUMN type text NOT NULL DEFAULT 'word'
    CONSTRAINT vocabulary_words_type_check
    CHECK (type IN ('word', 'expression')),
  ADD COLUMN image_path text;

CREATE TABLE public.vocabulary_meanings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vocabulary_word_id uuid NOT NULL
    REFERENCES public.vocabulary_words(id) ON DELETE CASCADE,
  part_of_speech text NOT NULL
    CHECK (
      part_of_speech IN (
        'noun',
        'verb',
        'adjective',
        'adverb',
        'pronoun',
        'preposition',
        'conjunction',
        'interjection',
        'determiner',
        'auxiliary verb'
      )
    ),
  meaning text NOT NULL CHECK (btrim(meaning) <> ''),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX vocabulary_meanings_vocabulary_word_id_idx
  ON public.vocabulary_meanings(vocabulary_word_id);

ALTER TABLE public.vocabulary_meanings ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.vocabulary_meanings FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.vocabulary_meanings TO authenticated;

CREATE POLICY "Users can view own vocabulary meanings"
  ON public.vocabulary_meanings
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.vocabulary_words
      WHERE vocabulary_words.id = vocabulary_meanings.vocabulary_word_id
        AND vocabulary_words.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert own vocabulary meanings"
  ON public.vocabulary_meanings
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.vocabulary_words
      WHERE vocabulary_words.id = vocabulary_meanings.vocabulary_word_id
        AND vocabulary_words.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update own vocabulary meanings"
  ON public.vocabulary_meanings
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.vocabulary_words
      WHERE vocabulary_words.id = vocabulary_meanings.vocabulary_word_id
        AND vocabulary_words.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.vocabulary_words
      WHERE vocabulary_words.id = vocabulary_meanings.vocabulary_word_id
        AND vocabulary_words.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete own vocabulary meanings"
  ON public.vocabulary_meanings
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.vocabulary_words
      WHERE vocabulary_words.id = vocabulary_meanings.vocabulary_word_id
        AND vocabulary_words.user_id = (SELECT auth.uid())
    )
  );
ALTER TABLE public.community_words
  ADD COLUMN IF NOT EXISTS source_vocabulary_word_id uuid
    REFERENCES public.vocabulary_words(id) ON DELETE SET NULL;

-- Link existing owner requests to the matching word in that owner's collection
-- where possible, so rejected requests remain safely resubmittable.
UPDATE public.community_words AS request
SET source_vocabulary_word_id = source_word.id
FROM public.community_categories AS category,
     public.vocabulary_words AS source_word
WHERE request.category_id = category.id
  AND source_word.user_id = request.owner_id
  AND lower(regexp_replace(btrim(source_word.category), '[[:space:]]+', ' ', 'g') COLLATE "C") = category.normalized_name
  AND lower(regexp_replace(btrim(source_word.word), '[[:space:]]+', ' ', 'g') COLLATE "C") = request.normalized_word
  AND request.status IN ('pending', 'rejected')
  AND request.source_vocabulary_word_id IS NULL;

DROP POLICY IF EXISTS "Users can submit community words in own categories" ON public.community_words;
CREATE POLICY "Users can submit own vocabulary words"
  ON public.community_words FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = (SELECT auth.uid())
    AND status = 'pending'
    AND source_vocabulary_word_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.vocabulary_words AS source_word
      JOIN public.community_categories AS category ON category.id = community_words.category_id
      WHERE source_word.id = community_words.source_vocabulary_word_id
        AND source_word.user_id = (SELECT auth.uid())
        AND lower(regexp_replace(btrim(source_word.word), '[[:space:]]+', ' ', 'g') COLLATE "C") = community_words.normalized_word
        AND lower(regexp_replace(btrim(source_word.category), '[[:space:]]+', ' ', 'g') COLLATE "C") = category.normalized_name
        AND (category.owner_id = (SELECT auth.uid()) OR category.status = 'published')
    )
  );

DROP POLICY IF EXISTS "Owners can edit pending community words" ON public.community_words;
CREATE POLICY "Owners can edit own pending community words"
  ON public.community_words FOR UPDATE TO authenticated
  USING (owner_id = (SELECT auth.uid()) AND status IN ('pending', 'rejected'))
  WITH CHECK (
    owner_id = (SELECT auth.uid())
    AND status IN ('pending', 'rejected')
    AND source_vocabulary_word_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.vocabulary_words AS source_word
      JOIN public.community_categories AS category ON category.id = community_words.category_id
      WHERE source_word.id = community_words.source_vocabulary_word_id
        AND source_word.user_id = (SELECT auth.uid())
        AND lower(regexp_replace(btrim(source_word.word), '[[:space:]]+', ' ', 'g') COLLATE "C") = community_words.normalized_word
        AND lower(regexp_replace(btrim(source_word.category), '[[:space:]]+', ' ', 'g') COLLATE "C") = category.normalized_name
        AND (category.owner_id = (SELECT auth.uid()) OR category.status = 'published')
    )
  );

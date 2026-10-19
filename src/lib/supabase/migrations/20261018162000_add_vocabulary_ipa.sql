ALTER TABLE public.vocabulary_words
  ADD COLUMN ipa text;

COMMENT ON COLUMN public.vocabulary_words.ipa IS
  'Optional IPA pronunciation for vocabulary words.';

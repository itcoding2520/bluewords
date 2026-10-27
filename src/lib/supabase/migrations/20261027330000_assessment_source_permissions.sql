-- Assessment generation reads vocabulary and sentence banks with the service role.
-- Explicit table grants are required even though service_role bypasses row-level security.
GRANT SELECT ON public.vocabulary_words, public.sentence_builder_questions TO service_role;

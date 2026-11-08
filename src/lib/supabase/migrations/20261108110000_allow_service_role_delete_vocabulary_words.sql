-- Admin account deletion removes the owner's vocabulary before deleting their
-- auth account, because category cleanup otherwise conflicts with a RESTRICT FK.
-- Keep this permission server-only; anon and authenticated retain their current grants.
GRANT DELETE ON TABLE public.vocabulary_words TO service_role;

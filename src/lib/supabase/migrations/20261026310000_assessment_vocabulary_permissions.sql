-- Assessment generation reads the canonical word-key list using the service role.
GRANT SELECT ON public.default_vocabulary_keys TO service_role;

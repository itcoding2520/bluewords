CREATE OR REPLACE FUNCTION public.reassign_vocabulary_before_category_delete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.is_default THEN
    -- Keep the default category protected during normal category management,
    -- but allow its owner row to cascade-delete the category with the account.
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = OLD.user_id) THEN
      RAISE EXCEPTION 'The Uncategorized category cannot be deleted.';
    END IF;

    RETURN OLD;
  END IF;

  UPDATE public.vocabulary_words
  SET category = 'Uncategorized'
  WHERE user_id = OLD.user_id
    AND category = OLD.name;

  RETURN OLD;
END;
$$;

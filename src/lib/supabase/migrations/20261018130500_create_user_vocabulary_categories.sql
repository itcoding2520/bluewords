CREATE TABLE public.vocabulary_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL
    REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL
    CHECK (btrim(name) <> ''),
  color text NOT NULL
    CHECK (color IN ('blue', 'violet', 'orange', 'green', 'rose')),
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vocabulary_categories_user_name_key
    UNIQUE (user_id, name),
  CONSTRAINT vocabulary_categories_default_name_check
    CHECK (NOT is_default OR name = 'Uncategorized')
);

CREATE UNIQUE INDEX vocabulary_categories_user_default_key
  ON public.vocabulary_categories(user_id)
  WHERE is_default;

CREATE UNIQUE INDEX vocabulary_categories_user_lower_name_key
  ON public.vocabulary_categories(user_id, lower(name));

ALTER TABLE public.vocabulary_categories ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES
  ON TABLE public.vocabulary_categories
  FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.vocabulary_categories
  TO authenticated;

REVOKE TRUNCATE
  ON TABLE public.vocabulary_categories
  FROM anon, authenticated;

CREATE POLICY "Users can view own vocabulary categories"
  ON public.vocabulary_categories
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own non-default vocabulary categories"
  ON public.vocabulary_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND is_default = false
  );

CREATE POLICY "Users can update own vocabulary categories"
  ON public.vocabulary_categories
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own non-default vocabulary categories"
  ON public.vocabulary_categories
  FOR DELETE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND is_default = false
  );

CREATE FUNCTION public.set_vocabulary_categories_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_vocabulary_categories_updated_at
  BEFORE UPDATE ON public.vocabulary_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.set_vocabulary_categories_updated_at();

CREATE FUNCTION public.prevent_default_vocabulary_category_changes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.is_default AND (
    NEW.is_default IS DISTINCT FROM OLD.is_default
    OR NEW.name IS DISTINCT FROM OLD.name
    OR NEW.user_id IS DISTINCT FROM OLD.user_id
  ) THEN
    RAISE EXCEPTION 'The Uncategorized category cannot be renamed or reassigned.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_default_vocabulary_category_changes
  BEFORE UPDATE ON public.vocabulary_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_default_vocabulary_category_changes();

CREATE FUNCTION public.reassign_vocabulary_before_category_delete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.is_default THEN
    RAISE EXCEPTION 'The Uncategorized category cannot be deleted.';
  END IF;

  UPDATE public.vocabulary_words
  SET category = 'Uncategorized'
  WHERE user_id = OLD.user_id
    AND category = OLD.name;

  RETURN OLD;
END;
$$;

CREATE TRIGGER reassign_vocabulary_before_category_delete
  BEFORE DELETE ON public.vocabulary_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.reassign_vocabulary_before_category_delete();

CREATE FUNCTION public.create_default_vocabulary_categories_for_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.vocabulary_categories (
    user_id,
    name,
    color,
    is_default
  )
  VALUES
    (NEW.id, 'Uncategorized', 'blue', true),
    (NEW.id, 'Daily', 'blue', false),
    (NEW.id, 'Work', 'orange', false),
    (NEW.id, 'Frontend', 'violet', false)
  ON CONFLICT (user_id, name) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER create_default_vocabulary_categories_after_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_vocabulary_categories_for_user();

INSERT INTO public.vocabulary_categories (
  user_id,
  name,
  color,
  is_default
)
SELECT
  users.id,
  seeded.name,
  seeded.color,
  seeded.is_default
FROM auth.users AS users
CROSS JOIN (
  VALUES
    ('Uncategorized', 'blue', true),
    ('Daily', 'blue', false),
    ('Work', 'orange', false),
    ('Frontend', 'violet', false)
) AS seeded(name, color, is_default)
ON CONFLICT (user_id, name) DO NOTHING;

ALTER TABLE public.vocabulary_words
  DROP CONSTRAINT vocabulary_words_category_check;

ALTER TABLE public.vocabulary_words
  ADD CONSTRAINT vocabulary_words_user_category_fkey
  FOREIGN KEY (user_id, category)
  REFERENCES public.vocabulary_categories(user_id, name)
  ON UPDATE CASCADE
  ON DELETE RESTRICT;

CREATE INDEX vocabulary_words_user_category_idx
  ON public.vocabulary_words(user_id, category);
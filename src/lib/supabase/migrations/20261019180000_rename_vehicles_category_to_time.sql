BEGIN;

-- Merge existing Vehicles vocabulary into Time where a user already has Time.
UPDATE public.vocabulary_words AS word
SET category = target.name
FROM public.vocabulary_categories AS old_category
JOIN public.vocabulary_categories AS target
  ON target.user_id = old_category.user_id
 AND lower(target.name) = 'time'
WHERE old_category.user_id = word.user_id
  AND lower(old_category.name) = 'vehicles'
  AND word.category = old_category.name;

DELETE FROM public.vocabulary_categories AS old_category
WHERE lower(old_category.name) = 'vehicles'
  AND EXISTS (
    SELECT 1
    FROM public.vocabulary_categories AS target
    WHERE target.user_id = old_category.user_id
      AND lower(target.name) = 'time'
  );

-- For users without Time yet, rename Vehicles; the category FK cascades to words.
UPDATE public.vocabulary_categories
SET name = 'Time'
WHERE lower(name) = 'vehicles';

-- Keep future signups on Time even if an already-deployed legacy seed function
-- still inserts the former Vehicles category.
CREATE OR REPLACE FUNCTION public.create_default_vocabulary_categories_for_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.seed_starter_vocabulary_for_user(NEW.id);
  PERFORM public.seed_default_vocabulary_pack_for_user(NEW.id);

  UPDATE public.vocabulary_categories
  SET name = 'Time'
  WHERE user_id = NEW.id
    AND lower(name) = 'vehicles';

  RETURN NEW;
END;
$$;

COMMIT;

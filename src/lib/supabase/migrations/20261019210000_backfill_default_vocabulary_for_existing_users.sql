-- Add the complete default vocabulary to accounts created before the image-backed
-- signup seeder was installed. Existing words are preserved and never duplicated.
BEGIN;

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  FOR v_user_id IN
    SELECT users.id FROM auth.users AS users
  LOOP
    INSERT INTO public.vocabulary_categories (user_id, name, color, is_default)
    VALUES
      (v_user_id, 'Uncategorized', 'blue', true),
      (v_user_id, 'Fruits', 'green', false),
      (v_user_id, 'Colors', 'violet', false),
      (v_user_id, 'Animals', 'orange', false),
      (v_user_id, 'Family', 'rose', false),
      (v_user_id, 'Body', 'blue', false),
      (v_user_id, 'Supplies', 'violet', false),
      (v_user_id, 'Time', 'orange', false),
      (v_user_id, 'Weather', 'blue', false),
      (v_user_id, 'Clothes', 'rose', false),
      (v_user_id, 'Numbers', 'green', false),
      (v_user_id, 'School', 'blue', false),
      (v_user_id, 'House', 'orange', false),
      (v_user_id, 'Shapes', 'violet', false),
      (v_user_id, 'Food', 'green', false),
      (v_user_id, 'Jobs', 'blue', false),
      (v_user_id, 'Transport', 'orange', false),
      (v_user_id, 'Feelings', 'rose', false),
      (v_user_id, 'Actions', 'violet', false)
    ON CONFLICT DO NOTHING;

    -- The seeders skip any case-insensitive word match, preserving existing
    -- vocabulary rows. The image-backed seeder normalizes legacy category aliases.
    PERFORM public.seed_default_vocabulary_pack_for_user(v_user_id);
    PERFORM public.seed_remaining_default_vocabulary_packs_for_user(v_user_id);
  END LOOP;
END;
$$;

COMMIT;

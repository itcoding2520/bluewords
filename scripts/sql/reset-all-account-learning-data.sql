-- ONE-TIME, DESTRUCTIVE OPERATION.
-- Keeps auth.users and the shared default-vocabulary/* images.
-- Removes all users' vocabulary, meanings, categories, review schedules,
-- reviews, quiz sessions, and quiz answers, then seeds the image-backed defaults.
-- After this SQL commits, run cleanup-private-vocabulary-images.mjs to remove
-- now-unreferenced per-user image objects from Storage.
--
-- Safety gate: leave NO for a dry failure. Change it to YES only after backup
-- and after confirming this reset should affect every existing account.

BEGIN;
SET LOCAL app.confirm_reset_all_account_learning_data = 'YES';

DO $$
BEGIN
  IF current_setting('app.confirm_reset_all_account_learning_data', true) IS DISTINCT FROM 'YES' THEN
    RAISE EXCEPTION 'Reset not run. After backup, change the safety gate to YES and run this script again.';
  END IF;

  IF to_regprocedure('public.seed_default_vocabulary_pack_for_user(uuid)') IS NULL
     OR to_regprocedure('public.seed_remaining_default_vocabulary_packs_for_user(uuid)') IS NULL THEN
    RAISE EXCEPTION 'Default seed functions are missing. Apply the image-backed seed migrations first.';
  END IF;
END;
$$;

-- Sessions cascade-delete their answer snapshots. Remove them before words so
-- no quiz history remains with detached vocabulary_word_id values.
DELETE FROM public.vocabulary_quiz_sessions;

-- Meanings, review events, and review schedules cascade from vocabulary_words.
DELETE FROM public.vocabulary_words;

-- Uncategorized is protected by a trigger and is intentionally retained.
-- All other default and user-created categories are reset below.
DELETE FROM public.vocabulary_categories
WHERE NOT is_default;

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  FOR v_user_id IN
    SELECT users.id FROM auth.users AS users
  LOOP
    INSERT INTO public.vocabulary_categories (user_id, name, color, is_default)
    VALUES (v_user_id, 'Uncategorized', 'blue', true)
    ON CONFLICT (user_id, name) DO UPDATE
      SET color = EXCLUDED.color,
          is_default = true;

    INSERT INTO public.vocabulary_categories (user_id, name, color, is_default)
    VALUES
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

    PERFORM public.seed_default_vocabulary_pack_for_user(v_user_id);
    PERFORM public.seed_remaining_default_vocabulary_packs_for_user(v_user_id);
  END LOOP;
END;
$$;

COMMIT;

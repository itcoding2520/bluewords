-- Vocabulary uniqueness is scoped to the owner and category. The English
-- spelling is compared case-insensitively after trimming/collapsing whitespace;
-- meaning is not part of the key, and words may recur in other categories.
DO $$
DECLARE
  v_duplicate_groups integer;
BEGIN
  SELECT count(*) INTO v_duplicate_groups
  FROM (
    SELECT user_id, category, lower(regexp_replace(btrim(word), '[[:space:]]+', ' ', 'g') COLLATE "C")
    FROM public.vocabulary_words
    GROUP BY user_id, category, lower(regexp_replace(btrim(word), '[[:space:]]+', ' ', 'g') COLLATE "C")
    HAVING count(*) > 1
  ) AS duplicates;

  IF v_duplicate_groups > 0 THEN
    RAISE EXCEPTION 'Cannot apply Phase 3 uniqueness: % duplicate user/category/word groups need review first.', v_duplicate_groups
      USING HINT = 'Resolve duplicate English words within each user category without deleting vocabulary meanings, then re-run this migration.';
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS vocabulary_words_user_category_word_key
  ON public.vocabulary_words (user_id, category, lower(regexp_replace(btrim(word), '[[:space:]]+', ' ', 'g') COLLATE "C"));

CREATE TABLE IF NOT EXISTS public.app_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_admins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_admins FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.app_admins TO authenticated;
CREATE POLICY "Admins can view admin membership"
  ON public.app_admins FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE TABLE IF NOT EXISTS public.community_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (btrim(name) <> ''),
  normalized_name text GENERATED ALWAYS AS (lower(regexp_replace(btrim(name), '[[:space:]]+', ' ', 'g') COLLATE "C")) STORED,
  color text NOT NULL DEFAULT 'blue',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'rejected', 'removed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, normalized_name)
);
CREATE UNIQUE INDEX IF NOT EXISTS community_categories_active_name_key
  ON public.community_categories (normalized_name) WHERE status IN ('pending', 'published');
ALTER TABLE public.community_categories ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.community_categories FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_categories TO authenticated;
CREATE POLICY "Users can view own and published community categories"
  ON public.community_categories FOR SELECT TO authenticated
  USING (owner_id = (SELECT auth.uid()) OR status = 'published'
    OR EXISTS (SELECT 1 FROM public.app_admins WHERE user_id = (SELECT auth.uid())));
CREATE POLICY "Users can submit community categories"
  ON public.community_categories FOR INSERT TO authenticated
  WITH CHECK (owner_id = (SELECT auth.uid()) AND status = 'pending');
CREATE POLICY "Owners can edit pending community categories"
  ON public.community_categories FOR UPDATE TO authenticated
  USING (owner_id = (SELECT auth.uid()) AND status IN ('pending', 'rejected'))
  WITH CHECK (owner_id = (SELECT auth.uid()) AND status IN ('pending', 'rejected'));
CREATE POLICY "Admins can moderate community categories"
  ON public.community_categories FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.app_admins WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.app_admins WHERE user_id = (SELECT auth.uid())));
CREATE POLICY "Admins can add published community categories"
  ON public.community_categories FOR INSERT TO authenticated
  WITH CHECK (owner_id = (SELECT auth.uid()) AND status = 'published'
    AND EXISTS (SELECT 1 FROM public.app_admins WHERE user_id = (SELECT auth.uid())));
CREATE POLICY "Owners can remove pending community categories"
  ON public.community_categories FOR DELETE TO authenticated
  USING (owner_id = (SELECT auth.uid()) AND status IN ('pending', 'rejected'));

CREATE TABLE IF NOT EXISTS public.community_words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.community_categories(id) ON DELETE CASCADE,
  word text NOT NULL CHECK (btrim(word) <> ''),
  normalized_word text GENERATED ALWAYS AS (lower(regexp_replace(btrim(word), '[[:space:]]+', ' ', 'g') COLLATE "C")) STORED,
  meaning text NOT NULL DEFAULT '',
  ipa text,
  image_path text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'rejected', 'removed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, category_id, normalized_word)
);
CREATE UNIQUE INDEX IF NOT EXISTS community_words_active_category_word_key
  ON public.community_words (category_id, normalized_word) WHERE status IN ('pending', 'published');
ALTER TABLE public.community_words ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.community_words FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_words TO authenticated;
CREATE POLICY "Users can view own and published community words"
  ON public.community_words FOR SELECT TO authenticated
  USING (owner_id = (SELECT auth.uid()) OR (status = 'published' AND EXISTS (
      SELECT 1 FROM public.community_categories c
      WHERE c.id = category_id AND c.status = 'published'))
    OR EXISTS (SELECT 1 FROM public.app_admins WHERE user_id = (SELECT auth.uid())));
CREATE POLICY "Users can submit community words in own categories"
  ON public.community_words FOR INSERT TO authenticated
  WITH CHECK (owner_id = (SELECT auth.uid()) AND status = 'pending'
    AND EXISTS (SELECT 1 FROM public.community_categories c
      WHERE c.id = category_id AND (c.owner_id = (SELECT auth.uid()) OR c.status = 'published')));
CREATE POLICY "Owners can edit pending community words"
  ON public.community_words FOR UPDATE TO authenticated
  USING (owner_id = (SELECT auth.uid()) AND status IN ('pending', 'rejected'))
  WITH CHECK (owner_id = (SELECT auth.uid()) AND status IN ('pending', 'rejected'));
CREATE POLICY "Admins can moderate community words"
  ON public.community_words FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.app_admins WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.app_admins WHERE user_id = (SELECT auth.uid())));
CREATE POLICY "Admins can add published community words"
  ON public.community_words FOR INSERT TO authenticated
  WITH CHECK (owner_id = (SELECT auth.uid()) AND status = 'published'
    AND EXISTS (SELECT 1 FROM public.app_admins WHERE user_id = (SELECT auth.uid())));
CREATE POLICY "Owners can remove pending community words"
  ON public.community_words FOR DELETE TO authenticated
  USING (owner_id = (SELECT auth.uid()) AND status IN ('pending', 'rejected'));

CREATE TABLE IF NOT EXISTS public.default_vocabulary_keys (
  category_key text NOT NULL,
  normalized_word text NOT NULL,
  PRIMARY KEY (category_key, normalized_word)
);
ALTER TABLE public.default_vocabulary_keys ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.default_vocabulary_keys FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.validate_published_community_word()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_category_key text;
BEGIN
  SELECT normalized_name INTO v_category_key
  FROM public.community_categories
  WHERE id = NEW.category_id;

  IF v_category_key IS NULL THEN
    RAISE EXCEPTION 'The community category could not be found.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.default_vocabulary_keys AS default_word
    WHERE default_word.category_key = v_category_key
      AND default_word.normalized_word = NEW.normalized_word
  ) THEN
    RAISE unique_violation USING MESSAGE = 'This word already exists in the default vocabulary category.';
  END IF;

  IF NEW.status = 'published' AND NOT EXISTS (
    SELECT 1 FROM public.community_categories
    WHERE id = NEW.category_id AND status = 'published'
  ) THEN
    RAISE EXCEPTION 'A community word can only be published after its category is approved.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_published_community_word ON public.community_words;
CREATE TRIGGER validate_published_community_word
  BEFORE INSERT OR UPDATE OF status, category_id, word ON public.community_words
  FOR EACH ROW EXECUTE FUNCTION public.validate_published_community_word();

CREATE OR REPLACE FUNCTION public.validate_published_community_category()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'published' AND EXISTS (
    SELECT 1
    FROM public.community_words AS community_word
    JOIN public.default_vocabulary_keys AS default_word
      ON default_word.category_key = lower(btrim(NEW.name))
      AND default_word.normalized_word = community_word.normalized_word
    WHERE community_word.category_id = NEW.id
      AND community_word.status = 'published'
  ) THEN
    RAISE unique_violation USING MESSAGE = 'A published word already exists in the default vocabulary category.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_published_community_category ON public.community_categories;
CREATE TRIGGER validate_published_community_category
  BEFORE UPDATE OF status, name ON public.community_categories
  FOR EACH ROW EXECUTE FUNCTION public.validate_published_community_category();

CREATE OR REPLACE FUNCTION public.remove_words_with_community_category()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'removed' AND OLD.status IS DISTINCT FROM NEW.status THEN
    UPDATE public.community_words
    SET status = 'removed', updated_at = now()
    WHERE category_id = NEW.id AND status <> 'removed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS remove_words_with_community_category ON public.community_categories;
CREATE TRIGGER remove_words_with_community_category
  AFTER UPDATE OF status ON public.community_categories
  FOR EACH ROW EXECUTE FUNCTION public.remove_words_with_community_category();

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('publish_request', 'publish_approved', 'publish_rejected', 'admin_message')),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_recipient_created_idx
  ON public.notifications (recipient_id, created_at DESC);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.notifications FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.notifications TO authenticated;
GRANT UPDATE (read_at) ON public.notifications TO authenticated;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (recipient_id = (SELECT auth.uid()));
CREATE POLICY "Users can mark own notifications read"
  ON public.notifications FOR UPDATE TO authenticated
  USING (recipient_id = (SELECT auth.uid()))
  WITH CHECK (recipient_id = (SELECT auth.uid()));

CREATE OR REPLACE FUNCTION public.notify_vocabulary_moderation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entity_type text := TG_TABLE_NAME;
  v_status text := NEW.status;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NOT EXISTS (SELECT 1 FROM public.app_admins WHERE user_id = auth.uid()) THEN
      INSERT INTO public.notifications (recipient_id, actor_id, kind, title, body, entity_type, entity_id)
      SELECT admin.user_id, NEW.owner_id, 'publish_request',
        'Vocabulary publish request',
        CASE WHEN TG_TABLE_NAME = 'community_categories'
          THEN 'A category is waiting for review.' ELSE 'A word is waiting for review.' END,
        v_entity_type, NEW.id
      FROM public.app_admins AS admin;
    END IF;
  ELSIF OLD.status IS DISTINCT FROM v_status AND v_status = 'pending' THEN
    INSERT INTO public.notifications (recipient_id, actor_id, kind, title, body, entity_type, entity_id)
    SELECT admin.user_id, NEW.owner_id, 'publish_request',
      'Vocabulary publish request',
      CASE WHEN TG_TABLE_NAME = 'community_categories'
        THEN 'A category is waiting for review.' ELSE 'A word is waiting for review.' END,
      v_entity_type, NEW.id
    FROM public.app_admins AS admin;
  ELSIF OLD.status IS DISTINCT FROM v_status AND v_status IN ('published', 'rejected', 'removed') THEN
    INSERT INTO public.notifications (recipient_id, actor_id, kind, title, body, entity_type, entity_id)
    VALUES (NEW.owner_id, auth.uid(),
      CASE WHEN v_status = 'published' THEN 'publish_approved' ELSE 'publish_rejected' END,
      CASE WHEN v_status = 'published' THEN 'Vocabulary approved' ELSE 'Vocabulary request rejected' END,
      CASE WHEN v_status = 'published' THEN 'Your submission is now visible to signed-in users.' ELSE 'An admin reviewed your submission.' END,
      v_entity_type, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_community_category_moderation ON public.community_categories;
CREATE TRIGGER notify_community_category_moderation
  AFTER INSERT OR UPDATE OF status ON public.community_categories
  FOR EACH ROW EXECUTE FUNCTION public.notify_vocabulary_moderation();
DROP TRIGGER IF EXISTS notify_community_word_moderation ON public.community_words;
CREATE TRIGGER notify_community_word_moderation
  AFTER INSERT OR UPDATE OF status ON public.community_words
  FOR EACH ROW EXECUTE FUNCTION public.notify_vocabulary_moderation();

-- Guests can only read the immutable starter illustration folder.
GRANT SELECT ON TABLE storage.objects TO anon;
CREATE POLICY "Guests can view starter vocabulary images"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'vocabulary-images'
    AND (storage.foldername(name))[1] = 'default-vocabulary');

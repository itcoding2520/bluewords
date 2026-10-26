CREATE OR REPLACE FUNCTION public.notify_vocabulary_moderation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entity_type text := TG_TABLE_NAME;
  v_status text := NEW.status;
  v_actor_email text;
  v_category_name text;
  v_submission text;
  v_request_body text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF EXISTS (SELECT 1 FROM public.app_admins WHERE user_id = auth.uid()) THEN
      RETURN NEW;
    END IF;
  ELSIF OLD.status IS DISTINCT FROM v_status AND v_status IN ('published', 'rejected', 'removed') THEN
    INSERT INTO public.notifications (recipient_id, actor_id, kind, title, body, entity_type, entity_id)
    VALUES (NEW.owner_id, auth.uid(),
      CASE WHEN v_status = 'published' THEN 'publish_approved' ELSE 'publish_rejected' END,
      CASE WHEN v_status = 'published' THEN 'Vocabulary approved' ELSE 'Vocabulary request rejected' END,
      CASE WHEN v_status = 'published' THEN 'Your submission is now visible to everyone, including guests.' ELSE 'An admin reviewed your submission.' END,
      v_entity_type, NEW.id);
    RETURN NEW;
  ELSIF OLD.status IS NOT DISTINCT FROM v_status OR v_status <> 'pending' THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(email, 'A user') INTO v_actor_email
  FROM auth.users
  WHERE id = NEW.owner_id;

  IF TG_TABLE_NAME = 'community_categories' THEN
    v_submission := format('category “%s”', NEW.name);
  ELSE
    SELECT name INTO v_category_name
    FROM public.community_categories
    WHERE id = NEW.category_id;
    v_submission := format('word “%s” in category “%s”', NEW.word, COALESCE(v_category_name, 'Unknown'));
  END IF;
  v_request_body := format('%s requested to publish %s.', COALESCE(v_actor_email, 'A user'), v_submission);

  INSERT INTO public.notifications (recipient_id, actor_id, kind, title, body, entity_type, entity_id)
  SELECT admin.user_id, NEW.owner_id, 'publish_request', 'Vocabulary publish request', v_request_body, v_entity_type, NEW.id
  FROM public.app_admins AS admin;
  RETURN NEW;
END;
$$;

-- Refresh existing request notifications as well as future requests.
UPDATE public.notifications AS notification
SET body = CASE
  WHEN notification.entity_type = 'community_categories' THEN
    format('%s requested to publish category “%s”.',
      COALESCE((SELECT email FROM auth.users WHERE id = notification.actor_id), 'A user'),
      (SELECT name FROM public.community_categories WHERE id = notification.entity_id))
  WHEN notification.entity_type = 'community_words' THEN
    format('%s requested to publish word “%s” in category “%s”.',
      COALESCE((SELECT email FROM auth.users WHERE id = notification.actor_id), 'A user'),
      (SELECT word FROM public.community_words WHERE id = notification.entity_id),
      (SELECT category.name FROM public.community_words AS word
       JOIN public.community_categories AS category ON category.id = word.category_id
       WHERE word.id = notification.entity_id))
  ELSE notification.body
END
WHERE notification.kind = 'publish_request'
  AND ((notification.entity_type = 'community_categories' AND EXISTS (
         SELECT 1 FROM public.community_categories WHERE id = notification.entity_id))
    OR (notification.entity_type = 'community_words' AND EXISTS (
         SELECT 1 FROM public.community_words WHERE id = notification.entity_id)));

-- Collapse existing unread per-item notifications to one per sender, recipient,
-- and request type before enforcing the same behavior for future submissions.
WITH ranked AS (
  SELECT id,
    row_number() OVER (
      PARTITION BY recipient_id, actor_id, entity_type
      ORDER BY created_at DESC, id DESC
    ) AS position
  FROM public.notifications
  WHERE kind = 'publish_request' AND read_at IS NULL
)
UPDATE public.notifications AS notification
SET read_at = now()
FROM ranked
WHERE ranked.id = notification.id AND ranked.position > 1;

UPDATE public.notifications AS notification
SET title = CASE
      WHEN notification.entity_type = 'community_categories' THEN 'Category publish request'
      ELSE 'Word publish request'
    END,
    body = CASE
      WHEN notification.entity_type = 'community_categories' THEN
        format('%s submitted category requests for review.', COALESCE(sender.email, 'A user'))
      ELSE
        format('%s submitted word requests for review.', COALESCE(sender.email, 'A user'))
    END
FROM auth.users AS sender
WHERE notification.kind = 'publish_request'
  AND notification.actor_id = sender.id;

CREATE UNIQUE INDEX IF NOT EXISTS notifications_unread_publish_request_batch_key
  ON public.notifications (recipient_id, actor_id, entity_type)
  WHERE kind = 'publish_request' AND read_at IS NULL;

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
  v_title text;
  v_body text;
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
    v_title := 'Category publish request';
    v_body := format('%s submitted category requests for review.', COALESCE(v_actor_email, 'A user'));
  ELSE
    v_title := 'Word publish request';
    v_body := format('%s submitted word requests for review.', COALESCE(v_actor_email, 'A user'));
  END IF;

  INSERT INTO public.notifications (recipient_id, actor_id, kind, title, body, entity_type, entity_id)
  SELECT admin.user_id, NEW.owner_id, 'publish_request', v_title, v_body, v_entity_type, NEW.id
  FROM public.app_admins AS admin
  ON CONFLICT (recipient_id, actor_id, entity_type)
    WHERE kind = 'publish_request' AND read_at IS NULL
  DO UPDATE SET
    title = EXCLUDED.title,
    body = EXCLUDED.body,
    entity_id = EXCLUDED.entity_id,
    created_at = now();

  RETURN NEW;
END;
$$;

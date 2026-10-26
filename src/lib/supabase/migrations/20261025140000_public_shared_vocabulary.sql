-- Give each starter category a shared-library record so users can request
-- additional words without submitting the built-in category itself.
ALTER TABLE public.community_categories DISABLE TRIGGER notify_community_category_moderation;
INSERT INTO public.community_categories (owner_id, name, color, status)
SELECT admin.user_id, defaults.name, defaults.color, 'published'
FROM (SELECT user_id FROM public.app_admins ORDER BY created_at LIMIT 1) AS admin
CROSS JOIN (VALUES
  ('Actions', 'violet'),
  ('Animals', 'orange'),
  ('Body', 'blue'),
  ('Clothes', 'rose'),
  ('Colors', 'violet'),
  ('Family', 'rose'),
  ('Feelings', 'rose'),
  ('Food', 'green'),
  ('Fruits', 'green'),
  ('House', 'orange'),
  ('Jobs', 'blue'),
  ('Numbers', 'green'),
  ('School', 'blue'),
  ('Shapes', 'violet'),
  ('Supplies', 'violet'),
  ('Time', 'orange'),
  ('Transport', 'orange'),
  ('Weather', 'blue')
) AS defaults(name, color)
WHERE NOT EXISTS (
  SELECT 1 FROM public.community_categories existing
  WHERE existing.normalized_name = lower(defaults.name)
    AND existing.status IN ('pending', 'published')
);
ALTER TABLE public.community_categories ENABLE TRIGGER notify_community_category_moderation;

GRANT SELECT ON public.community_categories, public.community_words TO service_role;

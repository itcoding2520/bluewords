-- Admin-uploaded starter category images were stored on the admin's personal
-- category rows. Copy them to the published shared rows so every account and
-- the public vocabulary endpoint uses the same image.
WITH admin_images AS (
  SELECT DISTINCT ON (lower(regexp_replace(btrim(category.name), '[[:space:]]+', ' ', 'g') COLLATE "C"))
    lower(regexp_replace(btrim(category.name), '[[:space:]]+', ' ', 'g') COLLATE "C") AS normalized_name,
    category.image_path
  FROM public.vocabulary_categories AS category
  JOIN public.app_admins AS admin ON admin.user_id = category.user_id
  WHERE category.image_path IS NOT NULL
  ORDER BY lower(regexp_replace(btrim(category.name), '[[:space:]]+', ' ', 'g') COLLATE "C"), category.updated_at DESC
)
UPDATE public.community_categories AS shared
SET image_path = admin_images.image_path,
    updated_at = now()
FROM admin_images
WHERE shared.status = 'published'
  AND shared.normalized_name = admin_images.normalized_name
  AND shared.image_path IS DISTINCT FROM admin_images.image_path;

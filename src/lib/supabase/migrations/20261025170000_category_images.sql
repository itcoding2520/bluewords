ALTER TABLE public.vocabulary_categories
  ADD COLUMN IF NOT EXISTS image_path text;

ALTER TABLE public.community_categories
  ADD COLUMN IF NOT EXISTS image_path text;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('category-images', 'category-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

GRANT SELECT ON TABLE storage.objects TO anon;

DROP POLICY IF EXISTS "Anyone can view category images" ON storage.objects;
CREATE POLICY "Anyone can view category images"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'category-images');

DROP POLICY IF EXISTS "Users can upload own category images" ON storage.objects;
CREATE POLICY "Users can upload own category images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'category-images' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Users can update own category images" ON storage.objects;
CREATE POLICY "Users can update own category images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'category-images' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text)
  WITH CHECK (bucket_id = 'category-images' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Users can delete own category images" ON storage.objects;
CREATE POLICY "Users can delete own category images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'category-images' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

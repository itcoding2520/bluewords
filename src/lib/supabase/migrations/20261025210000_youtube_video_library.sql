CREATE TABLE IF NOT EXISTS public.videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (btrim(title) <> '' AND char_length(title) <= 150),
  youtube_url text NOT NULL CHECK (char_length(youtube_url) <= 2048),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS videos_created_at_desc_idx
  ON public.videos (created_at DESC, id DESC);

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.videos FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.videos TO authenticated;

CREATE POLICY "Authenticated users can view videos"
  ON public.videos FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can add videos"
  ON public.videos FOR INSERT TO authenticated
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.app_admins
      WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Admins can edit videos"
  ON public.videos FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.app_admins
      WHERE user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.app_admins
      WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Admins can delete videos"
  ON public.videos FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.app_admins
      WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE OR REPLACE FUNCTION public.set_video_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_videos_updated_at
  BEFORE UPDATE ON public.videos
  FOR EACH ROW EXECUTE FUNCTION public.set_video_updated_at();

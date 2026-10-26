ALTER TABLE public.videos
  ALTER COLUMN created_by DROP NOT NULL;

ALTER TABLE public.videos
  DROP CONSTRAINT IF EXISTS videos_created_by_fkey,
  ADD CONSTRAINT videos_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

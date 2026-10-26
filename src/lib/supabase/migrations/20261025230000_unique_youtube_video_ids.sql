ALTER TABLE public.videos
  ADD COLUMN youtube_video_id text;

UPDATE public.videos
SET youtube_video_id = COALESCE(
  (regexp_match(youtube_url, '^https?://(www\.)?youtu\.be/([A-Za-z0-9_-]{11})([/?#]|$)', 'i'))[2],
  (regexp_match(youtube_url, '^https?://(www\.)?(m\.)?youtube\.com/watch\?([^#]*&)?v=([A-Za-z0-9_-]{11})([&#]|$)', 'i'))[4],
  (regexp_match(youtube_url, '^https?://(www\.)?(m\.)?(youtube\.com|youtube-nocookie\.com)/(embed|shorts|live)/([A-Za-z0-9_-]{11})([/?#]|$)', 'i'))[5]
)
WHERE youtube_video_id IS NULL;

CREATE UNIQUE INDEX videos_youtube_video_id_key
  ON public.videos (youtube_video_id)
  WHERE youtube_video_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.set_video_youtube_video_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_match text[];
BEGIN
  v_match := regexp_match(NEW.youtube_url, '^https?://(www\.)?youtu\.be/([A-Za-z0-9_-]{11})([/?#]|$)', 'i');
  IF v_match IS NOT NULL THEN
    NEW.youtube_video_id := v_match[2];
  ELSE
    v_match := regexp_match(NEW.youtube_url, '^https?://(www\.)?(m\.)?youtube\.com/watch\?([^#]*&)?v=([A-Za-z0-9_-]{11})([&#]|$)', 'i');
    IF v_match IS NOT NULL THEN
      NEW.youtube_video_id := v_match[4];
    ELSE
      v_match := regexp_match(NEW.youtube_url, '^https?://(www\.)?(m\.)?(youtube\.com|youtube-nocookie\.com)/(embed|shorts|live)/([A-Za-z0-9_-]{11})([/?#]|$)', 'i');
      IF v_match IS NOT NULL THEN
        NEW.youtube_video_id := v_match[5];
      ELSE
        RAISE EXCEPTION 'Enter a valid YouTube video link.' USING ERRCODE = '22023';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER set_videos_youtube_video_id
  BEFORE INSERT OR UPDATE ON public.videos
  FOR EACH ROW EXECUTE FUNCTION public.set_video_youtube_video_id();

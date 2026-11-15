import { getErrorMessage } from "@/lib/errors";
import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@/lib/supabase/client";
import { getCachedVideosPage, peekCachedVideosPage } from "@/lib/videos-cache.mjs";
import { VIDEOS_PAGE_SIZE, type VideoRow } from "@/lib/videos";
import { loadVideosPage } from "@/lib/videos-api";
import { toast } from "sonner";


export function useVideosPageData(supabase: SupabaseClient, page: number) {
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadVideos = useCallback(async () => {
    const cached = peekCachedVideosPage(page, VIDEOS_PAGE_SIZE) as { videos: VideoRow[]; total: number } | null;
    if (cached) {
      setVideos(cached.videos);
      setTotal(cached.total);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const result = await getCachedVideosPage(
        page,
        VIDEOS_PAGE_SIZE,
        () => loadVideosPage(supabase, page, VIDEOS_PAGE_SIZE)
      ) as { videos: VideoRow[]; total: number };
      setVideos(result.videos);
      setTotal(result.total);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not load videos."));
    } finally {
      setIsLoading(false);
    }
  }, [page, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadVideos(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadVideos]);

  return { videos, total, isLoading, loadVideos };
}

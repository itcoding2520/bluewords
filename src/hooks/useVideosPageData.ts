import { getErrorMessage } from "@/lib/errors";
import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@/lib/supabase/client";
import { getCachedVideosPage, peekCachedVideosPage } from "@/lib/videos-cache.mjs";
import { VIDEOS_PAGE_SIZE, type VideoRow } from "@/lib/videos";
import { loadVideosPage } from "@/lib/videos-api";
import { scheduleDeferredTask } from "@/lib/schedule-deferred-task";
import { toast } from "sonner";

type VideosPage = { videos: VideoRow[]; total: number };

export function useVideosPageData(supabase: SupabaseClient, page: number) {
  const [pageData, setPageData] = useState<VideosPage>({ videos: [], total: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const loadVideos = useCallback(async () => {
    const cached = peekCachedVideosPage<VideosPage>(page, VIDEOS_PAGE_SIZE);
    if (cached) {
      setPageData(cached);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const result = await getCachedVideosPage(
        page,
        VIDEOS_PAGE_SIZE,
        () => loadVideosPage(supabase, page, VIDEOS_PAGE_SIZE)
      );
      setPageData(result);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not load videos."));
    } finally {
      setIsLoading(false);
    }
  }, [page, supabase]);

  useEffect(() => {
    return scheduleDeferredTask(() => { void loadVideos(); });
  }, [loadVideos]);

  return { ...pageData, isLoading, loadVideos };
}

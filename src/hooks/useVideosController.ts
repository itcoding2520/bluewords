"use client";

import { useState } from "react";

import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { VIDEOS_PAGE_SIZE } from "@/lib/videos";
import { createPageNavigationActions, getPageCount } from "@/lib/pagination";
import { useVideosPageData } from "@/hooks/useVideosPageData";
import { useVideosAdminActions } from "@/hooks/useVideosAdminActions";

export function useVideosController(isAdmin: boolean) {
  const supabase = useSupabaseClient();
  const [page, setPage] = useState(1);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  const { videos, total, isLoading, loadVideos } = useVideosPageData(supabase, page);
  const adminActions = useVideosAdminActions({ isAdmin, supabase, page, setPage, total, loadVideos });
  const pageCount = getPageCount(total, VIDEOS_PAGE_SIZE);
  const pageNavigation = createPageNavigationActions(pageCount, setPage);

  return {
    library: { videos, total, isLoading },
    pagination: {
      page,
      pageCount,
      pageSize: VIDEOS_PAGE_SIZE,
      setPage,
      ...pageNavigation,
    },
    playback: { playingVideoId, setPlayingVideoId },
    admin: adminActions,
  };
}

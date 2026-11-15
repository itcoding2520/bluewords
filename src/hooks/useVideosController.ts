"use client";

import { useState } from "react";

import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { VIDEOS_PAGE_SIZE } from "@/lib/videos";
import { getPageCount } from "@/lib/pagination";
import { useVideosPageData } from "@/hooks/useVideosPageData";
import { useVideosAdminActions } from "@/hooks/useVideosAdminActions";

export function useVideosController(isAdmin: boolean) {
  const supabase = useSupabaseClient();
  const [page, setPage] = useState(1);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  const { videos, total, isLoading, loadVideos } = useVideosPageData(supabase, page);
  const adminActions = useVideosAdminActions({ isAdmin, supabase, page, setPage, total, loadVideos });
  const pageCount = getPageCount(total, VIDEOS_PAGE_SIZE);

  function previousPage() {
    setPage((current) => Math.max(1, current - 1));
  }

  function nextPage() {
    setPage((current) => Math.min(pageCount, current + 1));
  }

  return {
    library: { videos, total, isLoading },
    pagination: {
      page,
      pageCount,
      pageSize: VIDEOS_PAGE_SIZE,
      setPage,
      previousPage,
      nextPage,
    },
    playback: { playingVideoId, setPlayingVideoId },
    admin: adminActions,
  };
}

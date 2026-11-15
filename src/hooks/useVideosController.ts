"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { useConfirmDialog } from "@/contexts/confirm-dialog";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { getCachedVideosPage, invalidateVideosCache, peekCachedVideosPage } from "@/lib/videos-cache.mjs";
import { getYoutubeVideoId, VIDEOS_PAGE_SIZE, type VideoRow } from "@/lib/videos";
import { createVideoRecord, findVideoByYoutubeId, loadVideosPage, removeVideoRecord, updateVideoRecord } from "@/lib/videos-api";

export function useVideosController(isAdmin: boolean) {
  const confirmDialog = useConfirmDialog();
  const supabase = useSupabaseClient();
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

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
      toast.error(error instanceof Error ? error.message : "Could not load videos.");
    } finally {
      setIsLoading(false);
    }
  }, [page, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadVideos(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadVideos]);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setYoutubeUrl("");
  }

  function startEditing(video: VideoRow) {
    setEditingId(video.id);
    setTitle(video.title);
    setYoutubeUrl(video.youtube_url);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveVideo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAdmin || isSaving) return;
    const trimmedTitle = title.trim();
    const trimmedUrl = youtubeUrl.trim();
    if (!trimmedTitle || trimmedTitle.length > 150) {
      toast.error("Enter a title between 1 and 150 characters.");
      return;
    }
    if (!getYoutubeVideoId(trimmedUrl)) {
      toast.error("Enter a valid YouTube video link.");
      return;
    }

    setIsSaving(true);
    try {
      const videoId = getYoutubeVideoId(trimmedUrl);
      if (!videoId) throw new Error("Enter a valid YouTube video link.");
      const duplicate = await findVideoByYoutubeId(supabase, videoId);
      if (duplicate && duplicate.id !== editingId) {
        toast.error("This YouTube video is already in the library.");
        return;
      }

      if (editingId) {
        await updateVideoRecord(supabase, editingId, { title: trimmedTitle, youtube_url: trimmedUrl });
        toast.success("Video updated.");
      } else {
        await createVideoRecord(supabase, { title: trimmedTitle, youtube_url: trimmedUrl });
        setPage(1);
        toast.success("Video added.");
      }
      invalidateVideosCache();
      resetForm();
      if (editingId || page === 1) await loadVideos();
      else setPage(1);
    } catch (error) {
      const isDuplicate = Boolean(error && typeof error === "object" && "code" in error && error.code === "23505");
      toast.error(isDuplicate ? "This YouTube video is already in the library." : error instanceof Error ? error.message : "Could not save video.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteVideo(video: VideoRow) {
    if (!isAdmin || isSaving) return;
    const confirmed = await confirmDialog({ title: "Delete video?", description: `Delete “${video.title}” from the video library?`, confirmLabel: "Delete" });
    if (!confirmed) return;

    setIsSaving(true);
    try {
      await removeVideoRecord(supabase, video.id);
      toast.success("Video deleted.");
      invalidateVideosCache();
      const nextTotal = Math.max(0, total - 1);
      const nextPage = Math.max(1, Math.min(page, Math.ceil(nextTotal / VIDEOS_PAGE_SIZE) || 1));
      if (nextPage !== page) setPage(nextPage);
      else await loadVideos();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete video.");
    } finally {
      setIsSaving(false);
    }
  }

  return {
    videos,
    total,
    page,
    setPage,
    isLoading,
    isSaving,
    editingId,
    title,
    setTitle,
    youtubeUrl,
    setYoutubeUrl,
    playingVideoId,
    setPlayingVideoId,
    pageSize: VIDEOS_PAGE_SIZE,
    resetForm,
    startEditing,
    saveVideo,
    deleteVideo,
  };
}

"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { useConfirmDialog } from "@/components/ui/ConfirmDialogProvider";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { getCachedVideosPage, invalidateVideosCache, peekCachedVideosPage } from "@/lib/videos-cache.mjs";
import { getYoutubeVideoId, VIDEOS_PAGE_SIZE, type VideoRow } from "@/lib/videos";

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
    const start = (page - 1) * VIDEOS_PAGE_SIZE;
    try {
      const result = await getCachedVideosPage(page, VIDEOS_PAGE_SIZE, async () => {
        const { data, count, error } = await supabase
          .from("videos")
          .select("id, title, youtube_url, created_by, created_at, updated_at", { count: "exact" })
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
          .range(start, start + VIDEOS_PAGE_SIZE - 1);
        if (error) throw error;
        return { videos: (data ?? []) as VideoRow[], total: count ?? 0 };
      }) as { videos: VideoRow[]; total: number };
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
      const { data: duplicate, error: lookupError } = await supabase
        .from("videos")
        .select("id")
        .eq("youtube_video_id", videoId)
        .maybeSingle();
      if (lookupError) throw lookupError;
      if (duplicate && duplicate.id !== editingId) {
        toast.error("This YouTube video is already in the library.");
        return;
      }

      if (editingId) {
        const { error } = await supabase.from("videos").update({ title: trimmedTitle, youtube_url: trimmedUrl }).eq("id", editingId);
        if (error) throw error;
        toast.success("Video updated.");
      } else {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error("Sign in to add a video.");
        const { error } = await supabase.from("videos").insert({ title: trimmedTitle, youtube_url: trimmedUrl, created_by: user.id });
        if (error) throw error;
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
      const { error } = await supabase.from("videos").delete().eq("id", video.id);
      if (error) throw error;
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

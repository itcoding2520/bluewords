import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { toast } from "sonner";
import { useConfirmDialog } from "@/contexts/confirm-dialog";
import type { createClient } from "@/lib/supabase/client";
import { invalidateVideosCache } from "@/lib/videos-cache.mjs";
import { getYoutubeVideoId, VIDEOS_PAGE_SIZE, type VideoRow } from "@/lib/videos";
import { createVideoRecord, findVideoByYoutubeId, removeVideoRecord, updateVideoRecord } from "@/lib/videos-api";

type SupabaseClient = ReturnType<typeof createClient>;

export function useVideosAdminActions({
  isAdmin,
  supabase,
  page,
  setPage,
  total,
  loadVideos,
}: {
  isAdmin: boolean;
  supabase: SupabaseClient;
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  total: number;
  loadVideos: () => Promise<void>;
}) {
  const confirmDialog = useConfirmDialog();
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");

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
    isSaving,
    editingId,
    title,
    setTitle,
    youtubeUrl,
    setYoutubeUrl,
    resetForm,
    startEditing,
    saveVideo,
    deleteVideo,
  };
}

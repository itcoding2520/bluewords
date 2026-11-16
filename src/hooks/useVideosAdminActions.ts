import { getErrorMessage } from "@/lib/errors";
import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { toast } from "sonner";
import { useConfirmDialog } from "@/contexts/confirm-dialog";
import type { SupabaseClient } from "@/lib/supabase/client";
import { invalidateVideosCache } from "@/lib/videos-cache.mjs";
import { getPageCount } from "@/lib/pagination";
import { getYoutubeVideoId, VIDEOS_PAGE_SIZE, type VideoRow } from "@/lib/videos";
import { createVideoRecord, findVideoByYoutubeId, removeVideoRecord, updateVideoRecord } from "@/lib/videos-api";
import { useVideosAdminForm } from "@/hooks/useVideosAdminForm";


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
  const form = useVideosAdminForm();
  const { editingId, title, youtubeUrl, resetForm } = form;

  async function saveVideo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAdmin || isSaving) return;
    const trimmedTitle = title.trim();
    const trimmedUrl = youtubeUrl.trim();
    if (!trimmedTitle || trimmedTitle.length > 150) {
      toast.error("Enter a title between 1 and 150 characters.");
      return;
    }
    const videoId = getYoutubeVideoId(trimmedUrl);
    if (!videoId) {
      toast.error("Enter a valid YouTube video link.");
      return;
    }

    setIsSaving(true);
    try {
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
      toast.error(isDuplicate ? "This YouTube video is already in the library." : getErrorMessage(error, "Could not save video."));
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
      const nextPage = Math.max(1, Math.min(page, getPageCount(nextTotal, VIDEOS_PAGE_SIZE)));
      if (nextPage !== page) setPage(nextPage);
      else await loadVideos();
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not delete video."));
    } finally {
      setIsSaving(false);
    }
  }

  return {
    isSaving,
    editingId,
    title: form.title,
    setTitle: form.setTitle,
    youtubeUrl: form.youtubeUrl,
    setYoutubeUrl: form.setYoutubeUrl,
    resetForm,
    startEditing: form.startEditing,
    saveVideo,
    deleteVideo,
  };
}

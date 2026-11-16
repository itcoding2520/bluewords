import { useState } from "react";
import type { VideoRow } from "@/lib/videos";

export function useVideosAdminForm() {
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

  return {
    editingId,
    title,
    setTitle,
    youtubeUrl,
    setYoutubeUrl,
    resetForm,
    startEditing,
  };
}

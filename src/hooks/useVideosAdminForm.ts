import { useState } from "react";
import type { VideoRow } from "@/lib/videos";

interface VideosAdminFormState {
  editingId: string | null;
  title: string;
  youtubeUrl: string;
}

const emptyForm: VideosAdminFormState = { editingId: null, title: "", youtubeUrl: "" };

export function useVideosAdminForm() {
  const [form, setForm] = useState<VideosAdminFormState>(emptyForm);

  function setTitle(title: string) {
    setForm((current) => ({ ...current, title }));
  }

  function setYoutubeUrl(youtubeUrl: string) {
    setForm((current) => ({ ...current, youtubeUrl }));
  }

  function resetForm() {
    setForm(emptyForm);
  }

  function startEditing(video: VideoRow) {
    setForm({ editingId: video.id, title: video.title, youtubeUrl: video.youtube_url });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return {
    editingId: form.editingId,
    title: form.title,
    setTitle,
    youtubeUrl: form.youtubeUrl,
    setYoutubeUrl,
    resetForm,
    startEditing,
  };
}

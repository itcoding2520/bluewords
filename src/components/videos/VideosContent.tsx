"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Clapperboard, Pencil, Play, Plus, Trash2, X } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { getCachedVideosPage, invalidateVideosCache, peekCachedVideosPage } from "@/lib/videos-cache.mjs";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { useConfirmDialog } from "@/components/ui/ConfirmDialogProvider";

const PAGE_SIZE = 24;

type VideoRow = {
  id: string;
  title: string;
  youtube_url: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

function getYoutubeVideoId(value: string): string | null {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (!["youtube.com", "m.youtube.com", "youtu.be", "youtube-nocookie.com"].includes(host)) {
      return null;
    }

    let videoId: string | null = null;
    if (host === "youtu.be") {
      videoId = url.pathname.split("/").filter(Boolean)[0] ?? null;
    } else if (url.pathname === "/watch") {
      videoId = url.searchParams.get("v");
    } else {
      const segments = url.pathname.split("/").filter(Boolean);
      if (["embed", "shorts", "live"].includes(segments[0] ?? "")) {
        videoId = segments[1] ?? null;
      }
    }

    return videoId && /^[\w-]{11}$/.test(videoId) ? videoId : null;
  } catch {
    return null;
  }
}

export function VideosContent({ isAdmin }: { isAdmin: boolean }) {
  const confirmDialog = useConfirmDialog();
  const [supabase] = useState(() => createClient());
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
    const cached = peekCachedVideosPage(page, PAGE_SIZE) as { videos: VideoRow[]; total: number } | null;
    if (cached) {
      setVideos(cached.videos);
      setTotal(cached.total);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const start = (page - 1) * PAGE_SIZE;
    try {
      const result = await getCachedVideosPage(page, PAGE_SIZE, async () => {
        const { data, count, error } = await supabase
          .from("videos")
          .select("id, title, youtube_url, created_by, created_at, updated_at", { count: "exact" })
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
          .range(start, start + PAGE_SIZE - 1);
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
        const { error } = await supabase
          .from("videos")
          .update({ title: trimmedTitle, youtube_url: trimmedUrl })
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Video updated.");
      } else {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error("Sign in to add a video.");
        const { error } = await supabase.from("videos").insert({
          title: trimmedTitle,
          youtube_url: trimmedUrl,
          created_by: user.id,
        });
        if (error) throw error;
        setPage(1);
        toast.success("Video added.");
      }
      invalidateVideosCache();
      resetForm();
      if (editingId || page === 1) {
        await loadVideos();
      } else {
        setPage(1);
      }
    } catch (error) {
      const isDuplicate = Boolean(error && typeof error === "object" && "code" in error && error.code === "23505");
      toast.error(isDuplicate
        ? "This YouTube video is already in the library."
        : error instanceof Error ? error.message : "Could not save video.");
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
      const nextPage = Math.max(1, Math.min(page, Math.ceil(nextTotal / PAGE_SIZE) || 1));
      if (nextPage !== page) setPage(nextPage);
      else await loadVideos();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete video.");
    } finally {
      setIsSaving(false);
    }
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <header className="mb-6">
        <p className="text-sm font-medium text-blue-600">Video library</p>
        <h1 className="page-title mt-1">Videos</h1>
        <p className="page-intro-description mt-2">Watch videos shared by the BlueWords admins.</p>
      </header>

      {isAdmin && (
        <Card className="mb-6 p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            {editingId ? "Edit video" : "Add a video"}
          </h2>
          <form onSubmit={(event) => void saveVideo(event)} className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Video title
              <Input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={150} required placeholder="Enter a title" />
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              YouTube link
              <Input value={youtubeUrl} onChange={(event) => setYoutubeUrl(event.target.value)} type="url" required placeholder="https://www.youtube.com/watch?v=..." />
            </label>
            <div className="flex gap-2">
              <Button type="submit" disabled={isSaving}>
                {editingId ? <Pencil size={16} /> : <Plus size={16} />}
                {editingId ? "Save changes" : "Add video"}
              </Button>
              {editingId && (
                <Button type="button" variant="secondary" onClick={resetForm} disabled={isSaving} aria-label="Cancel editing">
                  <X size={16} />
                </Button>
              )}
            </div>
          </form>
        </Card>
      )}

      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-700">{total} videos</h2>
        {total > PAGE_SIZE && <p className="text-xs text-slate-500">Newest videos first</p>}
      </div>

      {isLoading ? (
        <Card className="p-10 text-center text-sm text-slate-500">Loading videos…</Card>
      ) : videos.length === 0 ? (
        <Card className="p-10 text-center">
          <Clapperboard className="mx-auto h-9 w-9 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">No videos have been added yet.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {videos.map((video) => {
            const videoId = getYoutubeVideoId(video.youtube_url);
            return (
              <Card key={video.id} className="flex h-full min-w-0 flex-col overflow-hidden">
                {videoId ? (
                  <div className="aspect-video bg-slate-950">
                    {playingVideoId === video.id ? (
                      <iframe
                        className="h-full w-full"
                        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
                        title={video.title}
                        referrerPolicy="strict-origin-when-cross-origin"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    ) : (
                      <button
                        type="button"
                        className="group relative block h-full w-full cursor-pointer overflow-hidden"
                        onClick={() => setPlayingVideoId(video.id)}
                        aria-label={`Play ${video.title}`}
                      >
                        <Image
                          src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
                          alt=""
                          fill
                          sizes="(max-width: 1023px) 50vw, 25vw"
                          unoptimized
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                        <span className="absolute inset-0 grid place-items-center bg-slate-950/20 transition group-hover:bg-slate-950/35">
                          <span className="grid size-12 place-items-center rounded-full bg-red-600 text-white shadow-lg">
                            <Play size={22} fill="currentColor" />
                          </span>
                        </span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid aspect-video place-items-center bg-slate-100 px-3 text-center text-xs text-slate-500">
                    This video link is invalid.
                  </div>
                )}
                <div className="flex flex-1 flex-col p-3 sm:p-4">
                  <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-slate-900 sm:min-h-12 sm:text-base sm:leading-6">{video.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">{new Date(video.created_at).toLocaleDateString()}</p>
                  {isAdmin && (
                    <div className="mt-auto flex justify-end border-t border-slate-100 pt-3"><ActionMenu label={video.title} disabled={isSaving} actions={[{ label: "Edit", icon: <Pencil size={15} />, onSelect: () => startEditing(video) }, { label: "Remove", icon: <Trash2 size={15} />, onSelect: () => void deleteVideo(video), destructive: true }]} /></div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {pageCount > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-3" aria-label="Video pages">
          <Button type="button" variant="secondary" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || isLoading}>
            Previous
          </Button>
          <span className="text-sm text-slate-600">Page {page} of {pageCount}</span>
          <Button type="button" variant="secondary" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page >= pageCount || isLoading}>
            Next
          </Button>
        </nav>
      )}
    </div>
  );
}

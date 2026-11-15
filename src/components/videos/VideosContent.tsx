"use client";

import { Clapperboard, Pencil, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { VideoCard } from "@/components/videos/VideoCard";
import { Input } from "@/components/ui/Input";
import { VIDEOS_PAGE_SIZE } from "@/lib/videos";
import { useVideosController } from "@/hooks/useVideosController";

export function VideosContent({ isAdmin }: { isAdmin: boolean }) {
  const controller = useVideosController(isAdmin);
  const {
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
    resetForm,
    startEditing,
    saveVideo,
    deleteVideo,
  } = controller;
  const pageCount = Math.max(1, Math.ceil(total / VIDEOS_PAGE_SIZE));

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
        {total > VIDEOS_PAGE_SIZE && <p className="text-xs text-slate-500">Newest videos first</p>}
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
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              isAdmin={isAdmin}
              isSaving={isSaving}
              isPlaying={playingVideoId === video.id}
              onPlay={() => setPlayingVideoId(video.id)}
              onEdit={() => startEditing(video)}
              onDelete={() => void deleteVideo(video)}
            />
          ))}
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

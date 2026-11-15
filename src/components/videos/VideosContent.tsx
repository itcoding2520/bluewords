"use client";

import { Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { VideoCard } from "@/components/videos/VideoCard";
import { VIDEOS_PAGE_SIZE } from "@/lib/videos";
import { useVideosController } from "@/hooks/useVideosController";
import { VideoAdminForm } from "@/components/videos/VideoAdminForm";

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

      {isAdmin && <VideoAdminForm
        editing={Boolean(editingId)}
        title={title}
        youtubeUrl={youtubeUrl}
        isSaving={isSaving}
        onTitleChange={setTitle}
        onYoutubeUrlChange={setYoutubeUrl}
        onSave={(event) => void saveVideo(event)}
        onCancel={resetForm}
      />}

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

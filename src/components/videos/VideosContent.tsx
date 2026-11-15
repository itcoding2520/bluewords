"use client";

import { Button } from "@/components/ui/Button";
import { VideoLibraryGrid } from "@/components/videos/VideoLibraryGrid";
import { VIDEOS_PAGE_SIZE } from "@/lib/videos";
import { useVideosController } from "@/hooks/useVideosController";
import { VideoAdminForm } from "@/components/videos/VideoAdminForm";

export function VideosContent({ isAdmin }: { isAdmin: boolean }) {
  const controller = useVideosController(isAdmin);
  const {
    videos,
    total,
    page,
    pageCount,
    previousPage,
    nextPage,
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

      <VideoLibraryGrid
        videos={videos}
        isAdmin={isAdmin}
        isLoading={isLoading}
        isSaving={isSaving}
        playingVideoId={playingVideoId}
        onPlay={setPlayingVideoId}
        onEdit={startEditing}
        onDelete={(video) => void deleteVideo(video)}
      />

      {pageCount > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-3" aria-label="Video pages">
          <Button type="button" variant="secondary" onClick={previousPage} disabled={page <= 1 || isLoading}>
            Previous
          </Button>
          <span className="text-sm text-slate-600">Page {page} of {pageCount}</span>
          <Button type="button" variant="secondary" onClick={nextPage} disabled={page >= pageCount || isLoading}>
            Next
          </Button>
        </nav>
      )}
    </div>
  );
}

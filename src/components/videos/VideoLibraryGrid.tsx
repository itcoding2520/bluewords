import { Clapperboard } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { VideoCard } from "@/components/videos/VideoCard";
import type { VideoRow } from "@/lib/videos";

export function VideoLibraryGrid({
  videos,
  isAdmin,
  isLoading,
  isSaving,
  playingVideoId,
  onPlay,
  onEdit,
  onDelete,
}: {
  videos: VideoRow[];
  isAdmin: boolean;
  isLoading: boolean;
  isSaving: boolean;
  playingVideoId: string | null;
  onPlay: (videoId: string) => void;
  onEdit: (video: VideoRow) => void;
  onDelete: (video: VideoRow) => void;
}) {
  if (isLoading) {
    return <Card className="p-10 text-center text-sm text-slate-500">Loading videos…</Card>;
  }

  if (videos.length === 0) {
    return (
      <Card className="p-10 text-center">
        <Clapperboard className="mx-auto h-9 w-9 text-slate-300" />
        <p className="mt-3 text-sm text-slate-500">No videos have been added yet.</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {videos.map((video) => (
        <VideoCard
          key={video.id}
          video={video}
          isAdmin={isAdmin}
          isSaving={isSaving}
          isPlaying={playingVideoId === video.id}
          onPlay={() => onPlay(video.id)}
          onEdit={() => onEdit(video)}
          onDelete={() => onDelete(video)}
        />
      ))}
    </div>
  );
}

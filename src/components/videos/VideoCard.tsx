import Image from "next/image";
import { Pencil, Play, Trash2 } from "lucide-react";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { Card } from "@/components/ui/Card";
import { getYoutubeVideoId, type VideoRow } from "@/lib/videos";
import { formatLocalDate } from "@/lib/formatDate";

interface VideoCardProps {
  video: VideoRow;
  isAdmin: boolean;
  isSaving: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function VideoCard({
  video,
  isAdmin,
  isSaving,
  isPlaying,
  onPlay,
  onEdit,
  onDelete,
}: VideoCardProps) {
  const videoId = getYoutubeVideoId(video.youtube_url);

  return (
    <Card className="flex h-full min-w-0 flex-col overflow-hidden">
      {videoId ? (
        <div className="aspect-video bg-slate-950">
          {isPlaying ? (
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
              onClick={onPlay}
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
        <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-slate-900 sm:min-h-12 sm:text-base sm:leading-6">
          {video.title}
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          {formatLocalDate(video.created_at)}
        </p>
        {isAdmin && (
          <div className="mt-auto flex justify-end border-t border-slate-100 pt-3">
            <ActionMenu
              label={video.title}
              disabled={isSaving}
              actions={[
                { label: "Edit", icon: <Pencil size={15} />, onSelect: onEdit },
                { label: "Remove", icon: <Trash2 size={15} />, onSelect: onDelete, destructive: true },
              ]}
            />
          </div>
        )}
      </div>
    </Card>
  );
}

export const VIDEOS_PAGE_SIZE = 24;

export type VideoRow = {
  id: string;
  title: string;
  youtube_url: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export function getYoutubeVideoId(value: string): string | null {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (!["youtube.com", "m.youtube.com", "youtu.be", "youtube-nocookie.com"].includes(host)) return null;

    let videoId: string | null = null;
    if (host === "youtu.be") videoId = url.pathname.split("/").filter(Boolean)[0] ?? null;
    else if (url.pathname === "/watch") videoId = url.searchParams.get("v");
    else {
      const segments = url.pathname.split("/").filter(Boolean);
      if (["embed", "shorts", "live"].includes(segments[0] ?? "")) videoId = segments[1] ?? null;
    }

    return videoId && /^[\w-]{11}$/.test(videoId) ? videoId : null;
  } catch {
    return null;
  }
}

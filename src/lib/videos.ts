export const VIDEOS_PAGE_SIZE = 24;
const YOUTUBE_HOSTS = new Set(["youtube.com", "m.youtube.com", "youtu.be", "youtube-nocookie.com"]);
const YOUTUBE_PATH_TYPES = new Set(["embed", "shorts", "live"]);

export type VideoRow = {
  id: string;
  title: string;
  youtube_url: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type VideoInputValidation =
  | { valid: false; reason: "title" | "youtube_url" }
  | { valid: true; title: string; youtubeUrl: string; videoId: string };

export function validateVideoInput(title: string, youtubeUrl: string): VideoInputValidation {
  const normalizedTitle = title.trim();
  const normalizedUrl = youtubeUrl.trim();
  if (!normalizedTitle || normalizedTitle.length > 150) {
    return { valid: false, reason: "title" };
  }

  const videoId = getYoutubeVideoId(normalizedUrl);
  if (!videoId) return { valid: false, reason: "youtube_url" };

  return { valid: true, title: normalizedTitle, youtubeUrl: normalizedUrl, videoId };
}

export function getYoutubeVideoId(value: string): string | null {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (!YOUTUBE_HOSTS.has(host)) return null;

    let videoId: string | null = null;
    if (host === "youtu.be") videoId = url.pathname.split("/").filter(Boolean)[0] ?? null;
    else if (url.pathname === "/watch") videoId = url.searchParams.get("v");
    else {
      const segments = url.pathname.split("/").filter(Boolean);
      if (YOUTUBE_PATH_TYPES.has(segments[0] ?? "")) videoId = segments[1] ?? null;
    }

    return videoId && /^[\w-]{11}$/.test(videoId) ? videoId : null;
  } catch {
    return null;
  }
}

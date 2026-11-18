import type { SupabaseClient } from "@/lib/supabase/client";
import type { VideoRow } from "@/lib/videos";
import { getInclusivePageRange } from "@/lib/pagination";


export async function loadVideosPage(
  supabase: SupabaseClient,
  page: number,
  pageSize: number
): Promise<{ videos: VideoRow[]; total: number }> {
  const { from, to } = getInclusivePageRange(page, pageSize);
  const { data, count, error } = await supabase
    .from("videos")
    .select("id, title, youtube_url, created_by, created_at, updated_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to);
  if (error) throw error;
  return { videos: (data ?? []) as VideoRow[], total: count ?? 0 };
}

export async function findVideoByYoutubeId(supabase: SupabaseClient, videoId: string) {
  const { data, error } = await supabase.from("videos")
    .select("id").eq("youtube_video_id", videoId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateVideoRecord(
  supabase: SupabaseClient,
  id: string,
  input: { title: string; youtube_url: string }
) {
  const { error } = await supabase.from("videos").update(input).eq("id", id);
  if (error) throw error;
}

export async function createVideoRecord(
  supabase: SupabaseClient,
  input: { title: string; youtube_url: string }
) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error("Sign in to add a video.");

  const { error } = await supabase.from("videos").insert({
    ...input,
    created_by: user.id,
  });
  if (error) throw error;
}

export async function removeVideoRecord(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("videos").delete().eq("id", id);
  if (error) throw error;
}

export async function saveVideoRecord(
  supabase: SupabaseClient,
  editingId: string | null,
  input: { title: string; youtube_url: string; videoId: string },
): Promise<"duplicate" | "created" | "updated"> {
  const duplicate = await findVideoByYoutubeId(supabase, input.videoId);
  if (duplicate && duplicate.id !== editingId) return "duplicate";

  if (editingId) {
    await updateVideoRecord(supabase, editingId, { title: input.title, youtube_url: input.youtube_url });
    return "updated";
  }

  await createVideoRecord(supabase, { title: input.title, youtube_url: input.youtube_url });
  return "created";
}

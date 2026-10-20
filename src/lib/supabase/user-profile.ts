import { createClient } from "@/lib/supabase/client";
import {
  getCachedUserProfile as readCachedUserProfile,
  setCachedUserProfile,
} from "@/lib/supabase/user-profile-cache.mjs";

export const USER_AVATARS_BUCKET = "user-avatars";
export const USER_PROFILE_UPDATED_EVENT = "bluewords:user-profile-updated";
export const MAX_USER_AVATAR_SIZE = 5 * 1024 * 1024;

export type UserProfile = {
  user_id: string;
  nickname: string | null;
  avatar_path: string | null;
  created_at: string;
  updated_at: string;
};

export function getCachedUserProfile(userId: string): UserProfile | null | undefined {
  return readCachedUserProfile(userId) as UserProfile | null | undefined;
}

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  supabase ??= createClient();
  return supabase;
}

export function getUserAvatarUrl(path: string | null | undefined): string | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!path || !supabaseUrl) return null;

  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `${supabaseUrl}/storage/v1/object/public/${USER_AVATARS_BUCKET}/${encodedPath}`;
}

export function validateUserAvatar(file: File): string | null {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return "Choose a JPEG, PNG, or WebP image.";
  }
  if (file.size > MAX_USER_AVATAR_SIZE) return "Image must be 5 MB or smaller.";
  return null;
}

export async function getUserProfile(userId: string, forceRefresh = false): Promise<UserProfile | null> {
  const cached = getCachedUserProfile(userId);
  if (!forceRefresh && cached !== undefined) return cached;

  const { data, error } = await getSupabase()
    .from("user_profiles")
    .select("user_id, nickname, avatar_path, created_at, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  const profile = data as UserProfile | null;
  setCachedUserProfile(userId, profile);
  return profile;
}

export async function uploadUserAvatar(file: File): Promise<string> {
  const validationError = validateUserAvatar(file);
  if (validationError) throw new Error(validationError);

  const { data: { user }, error: authError } = await getSupabase().auth.getUser();
  if (authError || !user) throw new Error("You must be logged in to upload an avatar.");

  const extension = file.type === "image/jpeg" ? "jpg" : file.type.slice("image/".length);
  const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
  const { error } = await getSupabase().storage.from(USER_AVATARS_BUCKET).upload(path, file, {
    // Every upload gets a unique path, so it is safe for browsers/CDNs to cache it for a year.
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  });

  if (error) throw error;
  return path;
}

export async function saveUserProfile(input: {
  nickname: string | null;
  avatarPath: string | null;
}): Promise<UserProfile> {
  const nickname = input.nickname?.trim() || null;
  if (nickname && (nickname.length < 2 || nickname.length > 24)) {
    throw new Error("Nickname must be between 2 and 24 characters.");
  }

  const { data: { user }, error: authError } = await getSupabase().auth.getUser();
  if (authError || !user) throw new Error("You must be logged in to update your profile.");
  if (input.avatarPath && !input.avatarPath.startsWith(`${user.id}/`)) {
    throw new Error("This avatar does not belong to your account.");
  }

  const { data, error } = await getSupabase()
    .from("user_profiles")
    .upsert({ user_id: user.id, nickname, avatar_path: input.avatarPath }, { onConflict: "user_id" })
    .select("user_id, nickname, avatar_path, created_at, updated_at")
    .single();

  if (error) throw error;
  const profile = data as UserProfile;
  setCachedUserProfile(user.id, profile);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<UserProfile>(USER_PROFILE_UPDATED_EVENT, { detail: profile }));
  }
  return profile;
}

export async function deleteUserAvatar(path: string): Promise<void> {
  const { data: { user }, error: authError } = await getSupabase().auth.getUser();
  if (authError || !user) throw new Error("You must be logged in to delete an avatar.");
  if (!path.startsWith(`${user.id}/`)) throw new Error("This avatar does not belong to your account.");

  const { error } = await getSupabase().storage.from(USER_AVATARS_BUCKET).remove([path]);
  if (error) throw error;
}

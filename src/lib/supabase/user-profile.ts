import { getUserProfileSupabase } from "@/lib/supabase/user-profile-client";
import { requireAuthenticatedUser } from "@/lib/supabase/authenticated-user";
import {
  getCachedUserProfile as readCachedUserProfile,
  setCachedUserProfile,
} from "@/lib/supabase/user-profile-cache.mjs";
export const USER_PROFILE_UPDATED_EVENT = "bluewords:user-profile-updated";
export { USER_AVATARS_BUCKET, MAX_USER_AVATAR_SIZE, getUserAvatarUrl, validateUserAvatar, uploadUserAvatar, deleteUserAvatar } from "@/lib/supabase/user-profile-avatars";

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

export function subscribeToUserProfileUpdates(onUpdate: (profile: UserProfile) => void): () => void {
  const handleProfileUpdated = (event: Event) => {
    onUpdate((event as CustomEvent<UserProfile>).detail);
  };
  window.addEventListener(USER_PROFILE_UPDATED_EVENT, handleProfileUpdated);
  return () => window.removeEventListener(USER_PROFILE_UPDATED_EVENT, handleProfileUpdated);
}

export async function getUserProfile(userId: string, forceRefresh = false): Promise<UserProfile | null> {
  const cached = getCachedUserProfile(userId);
  if (!forceRefresh && cached !== undefined) return cached;

  const { data, error } = await getUserProfileSupabase()
    .from("user_profiles")
    .select("user_id, nickname, avatar_path, created_at, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  const profile = data as UserProfile | null;
  setCachedUserProfile(userId, profile);
  return profile;
}
export async function saveUserProfile(input: {
  nickname: string | null;
  avatarPath: string | null;
}): Promise<UserProfile> {
  const nickname = input.nickname?.trim() || null;
  if (nickname && (nickname.length < 2 || nickname.length > 24)) {
    throw new Error("Nickname must be between 2 and 24 characters.");
  }

  const supabase = getUserProfileSupabase();
  const user = await requireAuthenticatedUser(supabase, "You must be logged in to update your profile.");
  if (input.avatarPath && !input.avatarPath.startsWith(`${user.id}/`)) {
    throw new Error("This avatar does not belong to your account.");
  }

  const { data, error } = await supabase
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

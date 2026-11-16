import { deleteUserAvatar, uploadUserAvatar } from "@/lib/supabase/user-profile-avatars";
import { saveUserProfile, type UserProfile } from "@/lib/supabase/user-profile";

export async function saveProfileWithAvatar(input: {
  nickname: string | null;
  avatarFile: File | null;
  avatarPath: string | null;
  previousAvatarPath: string | null;
}): Promise<{ profile: UserProfile; previousAvatarPath: string | null }> {
  let uploadedPath: string | null = null;
  try {
    if (input.avatarFile) uploadedPath = await uploadUserAvatar(input.avatarFile);
    const profile = await saveUserProfile({
      nickname: input.nickname,
      avatarPath: uploadedPath ?? input.avatarPath ?? null,
    });
    return { profile, previousAvatarPath: input.previousAvatarPath };
  } catch (error) {
    if (uploadedPath) {
      try {
        await deleteUserAvatar(uploadedPath);
      } catch (cleanupError) {
        console.warn("Could not remove the unused profile avatar:", cleanupError);
      }
    }
    throw error;
  }
}

export async function removeReplacedProfileAvatar(
  previousAvatarPath: string | null,
  updatedAvatarPath: string | null,
): Promise<void> {
  if (!previousAvatarPath || previousAvatarPath === updatedAvatarPath) return;
  try {
    await deleteUserAvatar(previousAvatarPath);
  } catch (cleanupError) {
    console.warn("Could not remove the previous profile avatar:", cleanupError);
  }
}

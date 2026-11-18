import { MAX_STANDARD_IMAGE_SIZE, validateStandardImage } from "@/lib/image-validation";
import { requireAuthenticatedUser } from "@/lib/supabase/authenticated-user";
import { getUserProfileSupabase } from "@/lib/supabase/user-profile-client";
import { uploadAuthenticatedImage } from "@/lib/supabase/storage-image-upload";

export const USER_AVATARS_BUCKET = "user-avatars";
export const MAX_USER_AVATAR_SIZE = MAX_STANDARD_IMAGE_SIZE;

export function getUserAvatarUrl(path: string | null | undefined): string | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!path || !supabaseUrl) return null;

  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `${supabaseUrl}/storage/v1/object/public/${USER_AVATARS_BUCKET}/${encodedPath}`;
}

export function validateUserAvatar(file: File): string | null {
  return validateStandardImage(file);
}

export async function uploadUserAvatar(file: File): Promise<string> {
  const validationError = validateUserAvatar(file);
  if (validationError) throw new Error(validationError);

  const supabase = getUserProfileSupabase();
  return uploadAuthenticatedImage({
    supabase,
    bucket: USER_AVATARS_BUCKET,
    file,
    authenticationError: "You must be logged in to upload an avatar.",
    // Avatar paths are unique, so browsers and CDNs can cache them for a year.
    cacheControl: "31536000",
  });
}

export async function deleteUserAvatar(path: string): Promise<void> {
  const supabase = getUserProfileSupabase();
  const user = await requireAuthenticatedUser(supabase, "You must be logged in to delete an avatar.");
  if (!path.startsWith(`${user.id}/`)) throw new Error("This avatar does not belong to your account.");

  const { error } = await supabase.storage.from(USER_AVATARS_BUCKET).remove([path]);
  if (error) throw error;
}

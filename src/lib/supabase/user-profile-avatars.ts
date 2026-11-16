import { requireAuthenticatedUser } from "@/lib/supabase/authenticated-user";
import { getStandardImageExtension, MAX_STANDARD_IMAGE_SIZE, validateStandardImage } from "@/lib/image-validation";
import { getUserProfileSupabase } from "@/lib/supabase/user-profile-client";

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
  const user = await requireAuthenticatedUser(supabase, "You must be logged in to upload an avatar.");
  const extension = getStandardImageExtension(file.type);
  const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(USER_AVATARS_BUCKET).upload(path, file, {
    // Every upload gets a unique path, so it is safe for browsers/CDNs to cache it for a year.
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  });

  if (error) throw error;
  return path;
}

export async function deleteUserAvatar(path: string): Promise<void> {
  const supabase = getUserProfileSupabase();
  const user = await requireAuthenticatedUser(supabase, "You must be logged in to delete an avatar.");
  if (!path.startsWith(`${user.id}/`)) throw new Error("This avatar does not belong to your account.");

  const { error } = await supabase.storage.from(USER_AVATARS_BUCKET).remove([path]);
  if (error) throw error;
}

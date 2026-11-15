import { createClient } from "@/lib/supabase/client";
import { requireAuthenticatedUser } from "@/lib/supabase/authenticated-user";
import { getStandardImageExtension, validateStandardImage } from "@/lib/image-validation";

export const CATEGORY_IMAGES_BUCKET = "category-images";
const supabase = createClient();

export function validateCategoryImage(file: File): string | null {
  return validateStandardImage(file);
}

export async function uploadCategoryImage(categoryId: string, file: File) {
  const validationError = validateCategoryImage(file);
  if (validationError) throw new Error(validationError);
  const user = await requireAuthenticatedUser(supabase, "You must be logged in to upload a category image.");
  const extension = getStandardImageExtension(file.type);
  const path = `${user.id}/${categoryId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(CATEGORY_IMAGES_BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function deleteCategoryImage(path: string) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user || !path.startsWith(`${user.id}/`)) return;
  const { error } = await supabase.storage.from(CATEGORY_IMAGES_BUCKET).remove([path]);
  if (error) throw error;
}

export function getCategoryImageUrl(path?: string | null) {
  if (!path) return null;
  return supabase.storage.from(CATEGORY_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl;
}

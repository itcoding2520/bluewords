import { createClient } from "@/lib/supabase/client";
import { validateStandardImage } from "@/lib/image-validation";
import { uploadAuthenticatedImage } from "@/lib/supabase/storage-image-upload";

export const CATEGORY_IMAGES_BUCKET = "category-images";
const supabase = createClient();

export function validateCategoryImage(file: File): string | null {
  return validateStandardImage(file);
}

export async function uploadCategoryImage(categoryId: string, file: File) {
  const validationError = validateCategoryImage(file);
  if (validationError) throw new Error(validationError);
  return uploadAuthenticatedImage({
    supabase,
    bucket: CATEGORY_IMAGES_BUCKET,
    ownerFolder: categoryId,
    file,
    authenticationError: "You must be logged in to upload a category image.",
  });
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

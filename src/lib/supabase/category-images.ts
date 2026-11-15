import { createClient } from "@/lib/supabase/client";
import { validateStandardImage } from "@/lib/image-validation";

export const CATEGORY_IMAGES_BUCKET = "category-images";
const supabase = createClient();

export function validateCategoryImage(file: File): string | null {
  return validateStandardImage(file);
}

export async function uploadCategoryImage(categoryId: string, file: File) {
  const validationError = validateCategoryImage(file);
  if (validationError) throw new Error(validationError);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("You must be logged in to upload a category image.");
  const extension = file.type === "image/jpeg" ? "jpg" : file.type.slice(6);
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

import { createClient } from "@/lib/supabase/client";

export const CATEGORY_IMAGES_BUCKET = "category-images";
const supabase = createClient();

export function validateCategoryImage(file: File): string | null {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return "Choose a JPEG, PNG, or WebP image.";
  }
  if (file.size > 5 * 1024 * 1024) return "Image must be 5 MB or smaller.";
  return null;
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

import type { createClient } from "@/lib/supabase/client";
import type { VocabularyCategoryRow, VocabularyCategoryUpdate } from "@/lib/supabase/categories";
import { deleteCategoryImage, uploadCategoryImage } from "@/lib/supabase/category-images";
import {
  updatePublishedCategoryImageByName,
  updateSharedCategoryImage,
} from "@/lib/category-management-api";

type SupabaseClient = ReturnType<typeof createClient>;

export function useCategoryImageActions({
  supabase,
  isAdmin,
  updateCategory,
  refreshCategories,
}: {
  supabase: SupabaseClient;
  isAdmin: boolean;
  updateCategory: (
    id: string,
    updates: VocabularyCategoryUpdate,
    options?: { silent?: boolean }
  ) => Promise<VocabularyCategoryRow | null>;
  refreshCategories: () => Promise<void>;
}) {
  async function saveImage(category: VocabularyCategoryRow, file: File) {
    const path = await uploadCategoryImage(category.id, file);
    const communityId = category.id.startsWith("community-category-")
      ? category.id.slice("community-category-".length)
      : null;
    if (communityId) {
      const error = await updateSharedCategoryImage(supabase, communityId, path);
      if (error) { await deleteCategoryImage(path); throw error; }
    } else {
      const updated = await updateCategory(category.id, { image_path: path }, { silent: true });
      if (!updated) {
        await deleteCategoryImage(path);
        throw new Error("Could not save the category image.");
      }
      if (isAdmin) {
        const error = await updatePublishedCategoryImageByName(supabase, category.name, path);
        if (error) { await deleteCategoryImage(path); throw error; }
      }
    }
    await refreshCategories();
    // Existing images can be shared by published category avatars, so replaced files stay in storage.
  }

  return { saveImage };
}

import { getErrorMessage } from "@/lib/errors";
import { useState, type FormEvent } from "react";
import { useConfirmDialog } from "@/contexts/confirm-dialog";
import type { useVocabulary } from "@/contexts/VocabularyContext";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { deleteCategoryImage, uploadCategoryImage, validateCategoryImage } from "@/lib/supabase/category-images";
import { toast } from "sonner";
import type { SupabaseClient } from "@/lib/supabase/client";
import { updateSharedCategoryDetails } from "@/lib/category-management-api";
import type { useCategoryManagementFormState } from "@/hooks/useCategoryManagementFormState";
import { getCommunityCategoryId } from "@/lib/vocabulary/community-category-id";
import { runWithBusyState } from "@/lib/run-with-busy-state";

type CategoryMutations = Pick<ReturnType<typeof useVocabulary>, "addCategory" | "updateCategory" | "deleteCategory">;

export function useCategoryManagementActions({
  form,
  supabase,
  isAdmin,
  setPage,
  saveImage,
  addCategory,
  updateCategory,
  deleteCategory,
}: {
  form: ReturnType<typeof useCategoryManagementFormState>;
  supabase: SupabaseClient;
  isAdmin: boolean;
  setPage: (page: number) => void;
  saveImage: (category: VocabularyCategoryRow, file: File) => Promise<void>;
} & CategoryMutations) {
  const confirmDialog = useConfirmDialog();
  const [isSaving, setIsSaving] = useState(false);

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim() || isSaving) return;
    if (form.newImage) {
      const validationError = validateCategoryImage(form.newImage);
      if (validationError) { toast.error(validationError); return; }
    }
    await runWithBusyState(setIsSaving, async () => {
      let uploadedPath: string | null = null;
      try {
        const id = form.newImage ? crypto.randomUUID() : undefined;
        if (id && form.newImage) uploadedPath = await uploadCategoryImage(id, form.newImage);
        const added = await addCategory({ id, name: form.name, color: form.color, image_path: uploadedPath });
        if (!added && uploadedPath) await deleteCategoryImage(uploadedPath);
        if (added) {
          form.resetNewCategory();
          setPage(1);
        }
      } catch (error) {
        if (uploadedPath) await deleteCategoryImage(uploadedPath).catch(() => undefined);
        toast.error(getErrorMessage(error, "Could not save the category image."));
      }
    });
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const editing = form.editing;
    if (!editing || isSaving) return;
    if (form.editImage) {
      const validationError = validateCategoryImage(form.editImage);
      if (validationError) { toast.error(validationError); return; }
    }
    await runWithBusyState(setIsSaving, async () => {
      try {
        const communityId = getCommunityCategoryId(editing.id);
        let updated = true;
        if (communityId !== null) {
          const error = await updateSharedCategoryDetails(supabase, communityId, { name: form.editName, color: form.editColor });
          if (error) throw error;
        } else {
          updated = Boolean(await updateCategory(
            editing.id,
            editing.is_default ? { color: form.editColor } : { name: form.editName, color: form.editColor }
          ));
        }
        if (updated && form.editImage && (isAdmin || !editing.is_default)) await saveImage(editing, form.editImage);
        if (updated) form.closeEdit();
      } catch (error) {
        toast.error(getErrorMessage(error, "Could not save the category image."));
      }
    });
  }

  async function handleDelete(category: VocabularyCategoryRow) {
    if (isSaving || category.is_default) return;
    const confirmed = await confirmDialog({
      title: "Delete category?",
      description: `Delete “${category.name}”? Words in this category will move to Uncategorized.`,
      confirmLabel: "Delete",
    });
    if (!confirmed) return;
    await runWithBusyState(setIsSaving, async () => {
      await deleteCategory(category.id);
    });
  }

  return { isSaving, handleAdd, handleUpdate, handleDelete };
}

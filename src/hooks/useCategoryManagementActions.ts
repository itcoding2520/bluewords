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
    setIsSaving(true);
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
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.editing || isSaving) return;
    if (form.editImage) {
      const validationError = validateCategoryImage(form.editImage);
      if (validationError) { toast.error(validationError); return; }
    }
    setIsSaving(true);
    try {
      const isSharedCategory = form.editing.id.startsWith("community-category-");
      let updated = true;
      if (isSharedCategory) {
        const id = form.editing.id.slice("community-category-".length);
        const error = await updateSharedCategoryDetails(supabase, id, { name: form.editName, color: form.editColor });
        if (error) throw error;
      } else {
        updated = Boolean(await updateCategory(
          form.editing.id,
          form.editing.is_default ? { color: form.editColor } : { name: form.editName, color: form.editColor }
        ));
      }
      if (updated && form.editImage && (isAdmin || !form.editing.is_default)) await saveImage(form.editing, form.editImage);
      if (updated) form.closeEdit();
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not save the category image."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(category: VocabularyCategoryRow) {
    if (isSaving || category.is_default) return;
    const confirmed = await confirmDialog({
      title: "Delete category?",
      description: `Delete “${category.name}”? Words in this category will move to Uncategorized.`,
      confirmLabel: "Delete",
    });
    if (!confirmed) return;
    setIsSaving(true);
    await deleteCategory(category.id);
    setIsSaving(false);
  }

  return { isSaving, handleAdd, handleUpdate, handleDelete };
}

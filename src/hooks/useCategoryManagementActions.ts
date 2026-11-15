import { useState, type FormEvent } from "react";
import { useConfirmDialog } from "@/contexts/confirm-dialog";
import type { useVocabulary } from "@/contexts/VocabularyContext";
import type { VocabularyCategoryColor, VocabularyCategoryRow } from "@/lib/supabase/categories";
import { deleteCategoryImage, uploadCategoryImage, validateCategoryImage } from "@/lib/supabase/category-images";
import { toast } from "sonner";
import type { createClient } from "@/lib/supabase/client";
import { updateSharedCategoryDetails } from "@/lib/category-management-api";

type SupabaseClient = ReturnType<typeof createClient>;
type CategoryMutations = Pick<ReturnType<typeof useVocabulary>, "addCategory" | "updateCategory" | "deleteCategory">;

export function useCategoryManagementActions({
  supabase,
  isAdmin,
  setPage,
  saveImage,
  addCategory,
  updateCategory,
  deleteCategory,
}: {
  supabase: SupabaseClient;
  isAdmin: boolean;
  setPage: (page: number) => void;
  saveImage: (category: VocabularyCategoryRow, file: File) => Promise<void>;
} & CategoryMutations) {
  const confirmDialog = useConfirmDialog();
  const [name, setName] = useState("");
  const [color, setColor] = useState<VocabularyCategoryColor>("blue");
  const [newImage, setNewImage] = useState<File | null>(null);
  const [editing, setEditing] = useState<VocabularyCategoryRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState<VocabularyCategoryColor>("blue");
  const [editImage, setEditImage] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function startEdit(category: VocabularyCategoryRow) {
    setEditing(category);
    setEditName(category.name);
    setEditColor(category.color);
    setEditImage(null);
  }

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || isSaving) return;
    if (newImage) {
      const validationError = validateCategoryImage(newImage);
      if (validationError) { toast.error(validationError); return; }
    }
    setIsSaving(true);
    let uploadedPath: string | null = null;
    try {
      const id = newImage ? crypto.randomUUID() : undefined;
      if (id && newImage) uploadedPath = await uploadCategoryImage(id, newImage);
      const added = await addCategory({ id, name, color, image_path: uploadedPath });
      if (!added && uploadedPath) await deleteCategoryImage(uploadedPath);
      if (added) {
        setName("");
        setColor("blue");
        setNewImage(null);
        setPage(1);
      }
    } catch (error) {
      if (uploadedPath) await deleteCategoryImage(uploadedPath).catch(() => undefined);
      toast.error(error instanceof Error ? error.message : "Could not save the category image.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || isSaving) return;
    if (editImage) {
      const validationError = validateCategoryImage(editImage);
      if (validationError) { toast.error(validationError); return; }
    }
    setIsSaving(true);
    try {
      const isSharedCategory = editing.id.startsWith("community-category-");
      let updated = true;
      if (isSharedCategory) {
        const id = editing.id.slice("community-category-".length);
        const error = await updateSharedCategoryDetails(supabase, id, { name: editName, color: editColor });
        if (error) throw error;
      } else {
        updated = Boolean(await updateCategory(
          editing.id,
          editing.is_default ? { color: editColor } : { name: editName, color: editColor }
        ));
      }
      if (updated && editImage && (isAdmin || !editing.is_default)) await saveImage(editing, editImage);
      if (updated) setEditing(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the category image.");
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

  return {
    name, setName, color, setColor, newImage, setNewImage, editing, setEditing,
    editName, setEditName, editColor, setEditColor, editImage, setEditImage,
    isSaving, startEdit, handleAdd, handleUpdate, handleDelete,
  };
}

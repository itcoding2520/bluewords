import { useState, type FormEvent } from "react";
import { useVocabulary } from "@/contexts/VocabularyContext";
import type {
  VocabularyCategoryRow,
} from "@/lib/supabase/categories";
import type { VocabularyCategoryColor } from "@/config/vocabulary";
import { useConfirmDialog } from "@/contexts/confirm-dialog";

export function useManageCategoriesController() {
  const confirmDialog = useConfirmDialog();
  const {
    categories,
    words,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useVocabulary({ loadWords: false, loadCategories: false });
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<VocabularyCategoryColor>("blue");
  const [editing, setEditing] = useState<VocabularyCategoryRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState<VocabularyCategoryColor>("blue");
  const [isSaving, setIsSaving] = useState(false);

  function startEditing(category: VocabularyCategoryRow) {
    setEditing(category);
    setEditName(category.name);
    setEditColor(category.color);
  }

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newName.trim() || isSaving) return;

    setIsSaving(true);
    const added = await addCategory({ name: newName, color: newColor });
    setIsSaving(false);
    if (added) {
      setNewName("");
      setNewColor("blue");
    }
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || !editName.trim() || isSaving) return;

    setIsSaving(true);
    const updated = await updateCategory(
      editing.id,
      editing.is_default
        ? { color: editColor }
        : { name: editName, color: editColor }
    );
    setIsSaving(false);
    if (updated) setEditing(null);
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
    const deleted = await deleteCategory(category.id);
    setIsSaving(false);
    if (deleted && editing?.id === category.id) setEditing(null);
  }

  return {
    data: { categories, words },
    form: {
      newName,
      setNewName,
      newColor,
      setNewColor,
      editing,
      setEditing,
      editName,
      setEditName,
      editColor,
      setEditColor,
    },
    status: { isSaving },
    actions: { startEditing, handleAdd, handleUpdate, handleDelete },
  };
}

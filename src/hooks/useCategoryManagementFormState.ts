import { useState } from "react";
import type { VocabularyCategoryColor } from "@/config/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";

export function useCategoryManagementFormState() {
  const [name, setName] = useState("");
  const [color, setColor] = useState<VocabularyCategoryColor>("blue");
  const [newImage, setNewImage] = useState<File | null>(null);
  const [editing, setEditing] = useState<VocabularyCategoryRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState<VocabularyCategoryColor>("blue");
  const [editImage, setEditImage] = useState<File | null>(null);

  function startEdit(category: VocabularyCategoryRow) {
    setEditing(category);
    setEditName(category.name);
    setEditColor(category.color);
    setEditImage(null);
  }

  function resetNewCategory() {
    setName("");
    setColor("blue");
    setNewImage(null);
  }

  function closeEdit() {
    setEditing(null);
  }

  return {
    name, setName, color, setColor, newImage, setNewImage,
    editing, setEditing, editName, setEditName, editColor, setEditColor,
    editImage, setEditImage, startEdit, resetNewCategory, closeEdit,
  };
}

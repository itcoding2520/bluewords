"use client";

import { FormEvent, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useVocabulary } from "@/contexts/VocabularyContext";
import type {
  VocabularyCategoryColor,
  VocabularyCategoryRow,
} from "@/lib/supabase/categories";
import { CategoryAvatar } from "@/components/vocabulary/CategoryAvatar";
import { useConfirmDialog } from "@/components/ui/ConfirmDialogProvider";

const colorOptions: Array<{
  value: VocabularyCategoryColor;
  label: string;
  className: string;
}> = [
  { value: "blue", label: "Blue", className: "bg-blue-500" },
  { value: "violet", label: "Violet", className: "bg-[#bf00ff]" },
  { value: "orange", label: "Orange", className: "bg-[#ff990a]" },
  { value: "green", label: "Green", className: "bg-emerald-500" },
  { value: "rose", label: "Rose", className: "bg-rose-500" },
  { value: "indigo", label: "Indigo", className: "bg-indigo-500" },
  { value: "teal", label: "Teal", className: "bg-teal-500" },
  { value: "amber", label: "Amber", className: "bg-amber-500" },
  { value: "pink", label: "Pink", className: "bg-pink-500" },
  { value: "slate", label: "Slate", className: "bg-slate-500" },
];

interface ManageCategoriesModalProps {
  open: boolean;
  onClose: () => void;
}

export function ManageCategoriesModal({
  open,
  onClose,
}: ManageCategoriesModalProps) {
  const confirmDialog = useConfirmDialog();
  const {
    categories,
    words,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useVocabulary({ loadWords: false, loadCategories: false });
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] =
    useState<VocabularyCategoryColor>("blue");
  const [editing, setEditing] =
    useState<VocabularyCategoryRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] =
    useState<VocabularyCategoryColor>("blue");
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

    if (deleted && editing?.id === category.id) {
      setEditing(null);
    }
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isSaving) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-sm" />
        <Dialog.Content className="hide-scrollbar fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-24px)] w-[calc(100%-24px)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:max-h-[calc(100dvh-48px)] sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Dialog.Title className="text-lg font-semibold text-slate-950 sm:text-xl">
                Manage categories
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-slate-500">
                Create categories and choose how their labels appear.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close"
                disabled={isSaving}
                className="flex size-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          <form
            onSubmit={handleAdd}
            className="mt-6 grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-[minmax(0,1fr)_130px_auto]"
          >
            <Input
              aria-label="New category name"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="New category"
              maxLength={50}
            />
            <Select
              aria-label="New category color"
              value={newColor}
              onChange={(event) =>
                setNewColor(event.target.value as VocabularyCategoryColor)
              }
            >
              {colorOptions.map((color) => (
                <option key={color.value} value={color.value}>
                  {color.label}
                </option>
              ))}
            </Select>
            <Button type="submit" disabled={!newName.trim() || isSaving}>
              <Plus size={16} />
              Add
            </Button>
          </form>

          <div className="mt-5 space-y-2">
            {categories.map((category) => {
              const color = colorOptions.find(
                (option) => option.value === category.color
              );

              return (
                <div
                  key={category.id}
                  className="rounded-xl border border-slate-200 p-3"
                >
                  {editing?.id === category.id ? (
                    <form
                      onSubmit={handleUpdate}
                      className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_130px_auto]"
                    >
                      <Input
                        aria-label="Category name"
                        value={editName}
                        onChange={(event) => setEditName(event.target.value)}
                        disabled={category.is_default}
                        maxLength={50}
                      />
                      <Select
                        aria-label="Category color"
                        value={editColor}
                        onChange={(event) =>
                          setEditColor(
                            event.target.value as VocabularyCategoryColor
                          )
                        }
                      >
                        {colorOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          aria-label={`Save ${category.name}`}
                          disabled={!editName.trim() || isSaving}
                          className="size-11 px-0"
                        >
                          <Check size={16} />
                        </Button>
                        <Button
                          variant="secondary"
                          aria-label="Cancel editing"
                          onClick={() => setEditing(null)}
                          disabled={isSaving}
                          className="size-11 px-0"
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center gap-3">
                      <CategoryAvatar name={category.name} imagePath={category.image_path} fallbackWordImagePath={words.find((word) => word.category.trim().toLocaleLowerCase() === category.name.trim().toLocaleLowerCase() && word.imagePath)?.imagePath} colorClass={color?.className ?? "bg-slate-300"} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {category.name}
                        </p>
                        {category.is_default && (
                          <p className="text-xs text-slate-500">
                            Default fallback category
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        aria-label={`Edit ${category.name}`}
                        onClick={() => startEditing(category)}
                        disabled={isSaving}
                        className="flex size-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
                      >
                        <Pencil size={16} />
                      </button>
                      {!category.is_default && (
                        <button
                          type="button"
                          aria-label={`Delete ${category.name}`}
                          onClick={() => void handleDelete(category)}
                          disabled={isSaving}
                          className="flex size-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

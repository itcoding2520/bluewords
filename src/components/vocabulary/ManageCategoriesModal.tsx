"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Check, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type {
  VocabularyCategoryColor,
} from "@/lib/supabase/categories";
import { ManageCategoryRow } from "@/components/vocabulary/ManageCategoryRow";
import { useManageCategoriesController } from "@/hooks/useManageCategoriesController";

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
  const {
    categories,
    words,
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
    isSaving,
    startEditing,
    handleAdd,
    handleUpdate,
    handleDelete,
  } = useManageCategoriesController();

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
                    <ManageCategoryRow
                      category={category}
                      colorClass={color?.className ?? "bg-slate-300"}
                      fallbackWordImagePath={words.find((word) => word.category.trim().toLocaleLowerCase() === category.name.trim().toLocaleLowerCase() && word.imagePath)?.imagePath}
                      isSaving={isSaving}
                      onEdit={() => startEditing(category)}
                      onDelete={() => void handleDelete(category)}
                    />
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

"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ManageCategoryList } from "@/components/vocabulary/ManageCategoryList";
import { useManageCategoriesController } from "@/hooks/useManageCategoriesController";
import { VocabularyCategoryColorSelect } from "@/components/vocabulary/VocabularyCategoryColorSelect";

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
            <VocabularyCategoryColorSelect
              ariaLabel="New category color"
              value={newColor}
              onChange={setNewColor}
            />
            <Button type="submit" disabled={!newName.trim() || isSaving}>
              <Plus size={16} />
              Add
            </Button>
          </form>

          <ManageCategoryList
            categories={categories}
            words={words}
            editing={editing}
            editName={editName}
            editColor={editColor}
            isSaving={isSaving}
            onEditNameChange={setEditName}
            onEditColorChange={setEditColor}
            onStartEditing={startEditing}
            onCancelEditing={() => setEditing(null)}
            onUpdate={handleUpdate}
            onDelete={(category) => void handleDelete(category)}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

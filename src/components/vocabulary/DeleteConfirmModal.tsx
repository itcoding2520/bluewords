
"use client";

import * as Dialog from "@radix-ui/react-dialog";

import { Button } from "@/components/ui/Button";
import type { VocabularyWord } from "@/data/vocabulary";

interface DeleteConfirmModalProps {
  word: VocabularyWord | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({
  word,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  return (
    <Dialog.Root
      open={Boolean(word)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-sm" />

        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-32px)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-5 shadow-xl sm:p-6">
          
          <Dialog.Title className="mt-4 text-lg font-semibold text-slate-950">
            Delete word?
          </Dialog.Title>

          <Dialog.Description className="mt-2 text-sm leading-6 text-slate-500">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-slate-900">
              &ldquo;{word?.word}&rdquo;
            </span>
            ? This action cannot be undone.
          </Dialog.Description>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Dialog.Close asChild>
              <Button variant="secondary" className="w-full sm:w-auto">
                Cancel
              </Button>
            </Dialog.Close>

            <button
              type="button"
              onClick={onConfirm}
              className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 sm:w-auto"
            >
              Delete word
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

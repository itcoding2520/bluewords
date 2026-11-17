import { useState, type Dispatch, type SetStateAction } from "react";
import type { VocabularyWord } from "@/data/vocabulary";
import { useConfirmDialog } from "@/contexts/confirm-dialog";
import { toast } from "sonner";
import { runWithBusyState } from "@/lib/run-with-busy-state";

export function useVocabularyContentMutations({
  selectedIds,
  setSelectedIds,
  setPageWords,
  setIsPageLoading,
  setPage,
  refreshPage,
  editingWord,
  deletingWord,
  setDeletingWord,
  handleCloseForm,
  addWord,
  updateWord,
  deleteWord,
  deleteWords,
  toggleMastered,
}: {
  selectedIds: Set<string>;
  setSelectedIds: Dispatch<SetStateAction<Set<string>>>;
  setPageWords: Dispatch<SetStateAction<VocabularyWord[]>>;
  setIsPageLoading: Dispatch<SetStateAction<boolean>>;
  setPage: Dispatch<SetStateAction<number>>;
  refreshPage: () => void;
  editingWord: VocabularyWord | null;
  deletingWord: VocabularyWord | null;
  setDeletingWord: Dispatch<SetStateAction<VocabularyWord | null>>;
  handleCloseForm: () => void;
  addWord: (word: VocabularyWord) => Promise<boolean>;
  updateWord: (word: VocabularyWord) => Promise<boolean>;
  deleteWord: (id: string) => Promise<boolean>;
  deleteWords: (ids: string[]) => Promise<number>;
  toggleMastered: (id: string, status: VocabularyWord["status"]) => Promise<boolean>;
}) {
  const confirmDialog = useConfirmDialog();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  function refreshCurrentPage(options: { clearVisibleWords?: boolean } = {}) {
    setIsPageLoading(true);
    if (options.clearVisibleWords) setPageWords([]);
    refreshPage();
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0 || isBulkDeleting) return;
    const count = selectedIds.size;
    const confirmed = await confirmDialog({
      title: `Delete ${count} ${count === 1 ? "word" : "words"}?`,
      description: "This action cannot be undone.",
      confirmLabel: "Delete",
    });
    if (!confirmed) return;

    await runWithBusyState(setIsBulkDeleting, async () => {
      const deletedCount = await deleteWords([...selectedIds]);
      if (deletedCount > 0) {
        setSelectedIds(new Set());
        refreshCurrentPage();
        toast.success(`Deleted ${deletedCount} ${deletedCount === 1 ? "word" : "words"}.`);
      }
    });
  }

  async function handleConfirmDelete() {
    if (!deletingWord || isSubmitting) return;
    await runWithBusyState(setIsSubmitting, async () => {
      const success = await deleteWord(deletingWord.id);
      if (success) {
        refreshCurrentPage({ clearVisibleWords: true });
        setSelectedIds((current) => {
          const next = new Set(current);
          next.delete(deletingWord.id);
          return next;
        });
        setDeletingWord(null);
      }
    });
  }

  async function handleSubmitWord(submittedWord: VocabularyWord): Promise<boolean> {
    if (isSubmitting) return false;
    return runWithBusyState(setIsSubmitting, async () => {
      const success = editingWord
        ? await updateWord(submittedWord)
        : await addWord(submittedWord);
      if (success) {
        setPage(1);
        refreshCurrentPage({ clearVisibleWords: true });
        handleCloseForm();
      }
      return success;
    });
  }

  async function handleToggleMastered(id: string, status: VocabularyWord["status"]) {
    const success = await toggleMastered(id, status);
    if (success) {
      refreshCurrentPage({ clearVisibleWords: true });
    }
    return success;
  }

  return { isSubmitting, isBulkDeleting, handleBulkDelete, handleConfirmDelete, handleSubmitWord, handleToggleMastered };
}

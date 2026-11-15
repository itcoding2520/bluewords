import { useState, type Dispatch, type SetStateAction } from "react";
import type { VocabularyWord } from "@/data/vocabulary";
import { useConfirmDialog } from "@/contexts/confirm-dialog";
import { toast } from "sonner";
import type { CategoryFilter, VocabularyStatusFilter } from "@/lib/vocabulary/filters";

interface VocabularyContentControllerOptions {
  selectedIds: Set<string>;
  setSelectedIds: Dispatch<SetStateAction<Set<string>>>;
  setPageWords: Dispatch<SetStateAction<VocabularyWord[]>>;
  setIsPageLoading: Dispatch<SetStateAction<boolean>>;
  setPage: Dispatch<SetStateAction<number>>;
  setSearch: (value: string) => void;
  setCategory: (value: CategoryFilter) => void;
  setStatus: (value: VocabularyStatusFilter) => void;
  setIsExportCountLoading: Dispatch<SetStateAction<boolean>>;
  refreshPage: () => void;
  addWord: (word: VocabularyWord) => Promise<boolean>;
  updateWord: (word: VocabularyWord) => Promise<boolean>;
  deleteWord: (id: string) => Promise<boolean>;
  deleteWords: (ids: string[]) => Promise<number>;
  toggleMastered: (id: string, status: VocabularyWord["status"]) => Promise<boolean>;
}

export function useVocabularyContentController({
  selectedIds,
  setSelectedIds,
  setPageWords,
  setIsPageLoading,
  setPage,
  setSearch,
  setCategory,
  setStatus,
  setIsExportCountLoading,
  refreshPage,
  addWord,
  updateWord,
  deleteWord,
  deleteWords,
  toggleMastered,
}: VocabularyContentControllerOptions) {
  const confirmDialog = useConfirmDialog();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<VocabularyWord | null>(null);
  const [deletingWord, setDeletingWord] = useState<VocabularyWord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  function handleOpenAdd() {
    setEditingWord(null);
    setIsFormOpen(true);
  }

  function handleEditWord(word: VocabularyWord) {
    setEditingWord(word);
    setIsFormOpen(true);
  }

  function handleCloseForm() {
    setIsFormOpen(false);
    setEditingWord(null);
  }

  function handleDeleteWord(word: VocabularyWord) {
    setDeletingWord(word);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setIsPageLoading(true);
    setPageWords([]);
    setPage(1);
    setSelectedIds(new Set());
  }

  function handleCategoryChange(value: CategoryFilter) {
    setCategory(value);
    setIsPageLoading(true);
    setIsExportCountLoading(value !== "All");
    setPageWords([]);
    setPage(1);
    setSelectedIds(new Set());
  }

  function handleStatusChange(value: VocabularyStatusFilter) {
    setStatus(value);
    setIsPageLoading(true);
    setPageWords([]);
    setPage(1);
    setSelectedIds(new Set());
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

    setIsBulkDeleting(true);
    try {
      const deletedCount = await deleteWords([...selectedIds]);
      if (deletedCount > 0) {
        setSelectedIds(new Set());
        setIsPageLoading(true);
        refreshPage();
        toast.success(`Deleted ${deletedCount} ${deletedCount === 1 ? "word" : "words"}.`);
      }
    } finally {
      setIsBulkDeleting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deletingWord || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const success = await deleteWord(deletingWord.id);
      if (success) {
        setIsPageLoading(true);
        setPageWords([]);
        refreshPage();
        setSelectedIds((current) => {
          const next = new Set(current);
          next.delete(deletingWord.id);
          return next;
        });
        setDeletingWord(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmitWord(submittedWord: VocabularyWord): Promise<boolean> {
    if (isSubmitting) return false;
    setIsSubmitting(true);
    try {
      const success = editingWord
        ? await updateWord(submittedWord)
        : await addWord(submittedWord);
      if (success) {
        setPage(1);
        setIsPageLoading(true);
        setPageWords([]);
        refreshPage();
        handleCloseForm();
      }
      return success;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleMastered(id: string, status: VocabularyWord["status"]) {
    const success = await toggleMastered(id, status);
    if (success) {
      setIsPageLoading(true);
      setPageWords([]);
      refreshPage();
    }
    return success;
  }

  return {
    isFormOpen,
    setIsFormOpen,
    isCategoriesOpen,
    setIsCategoriesOpen,
    editingWord,
    deletingWord,
    setDeletingWord,
    isSubmitting,
    isBulkDeleting,
    handleOpenAdd,
    handleEditWord,
    handleCloseForm,
    handleDeleteWord,
    handleSearchChange,
    handleCategoryChange,
    handleStatusChange,
    handleBulkDelete,
    handleConfirmDelete,
    handleSubmitWord,
    handleToggleMastered,
  };
}

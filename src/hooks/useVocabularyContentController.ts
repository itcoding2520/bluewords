import { useState, type Dispatch, type SetStateAction } from "react";
import type { VocabularyWord } from "@/data/vocabulary";
import type { CategoryFilter, VocabularyStatusFilter } from "@/lib/vocabulary/filters";
import { useVocabularyContentMutations } from "@/hooks/useVocabularyContentMutations";

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
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<VocabularyWord | null>(null);
  const [deletingWord, setDeletingWord] = useState<VocabularyWord | null>(null);

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

  const mutations = useVocabularyContentMutations({
    selectedIds, setSelectedIds, setPageWords, setIsPageLoading, setPage, refreshPage,
    editingWord, deletingWord, setDeletingWord, handleCloseForm,
    addWord, updateWord, deleteWord, deleteWords, toggleMastered,
  });

  return {
    isFormOpen,
    setIsFormOpen,
    isCategoriesOpen,
    setIsCategoriesOpen,
    editingWord,
    deletingWord,
    setDeletingWord,
    handleOpenAdd,
    handleEditWord,
    handleCloseForm,
    handleDeleteWord,
    handleSearchChange,
    handleCategoryChange,
    handleStatusChange,
    ...mutations,
  };
}

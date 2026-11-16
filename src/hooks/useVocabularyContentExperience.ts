import { useVocabulary } from "@/contexts/VocabularyContext";
import { useVocabularySelection } from "@/hooks/useVocabularySelection";
import { useVocabularyPageData } from "@/hooks/useVocabularyPageData";
import { useVocabularyContentFilters } from "@/hooks/useVocabularyContentFilters";
import { useVocabularyCategoryExportCount } from "@/hooks/useVocabularyCategoryExportCount";
import { useLegacyVocabularyImport } from "@/hooks/useLegacyVocabularyImport";
import { useVocabularyContentController } from "@/hooks/useVocabularyContentController";
import { useVocabularyContentPagination } from "@/hooks/useVocabularyContentPagination";
import { loadVocabularyExportWords } from "@/lib/vocabulary/export-words";

export function useVocabularyContentExperience(isAdmin: boolean) {
  const {
    categories,
    words,
    categoriesLoaded,
    addWord,
    updateWord,
    deleteWord,
    deleteWords,
    toggleMastered,
    refreshWords,
    authVersion,
  } = useVocabulary({ loadWords: false });
  const filters = useVocabularyContentFilters(categories);
  const { page, pageSize, debouncedSearch, selectedCategory, setPage } = filters;
  const pageData = useVocabularyPageData({
    authVersion,
    categories,
    categoriesLoaded,
    query: {
      page,
      pageSize,
      search: debouncedSearch,
      category: selectedCategory === "All" ? null : selectedCategory,
      status: filters.status === "all" ? null : filters.status,
    },
    onPageOutOfRange: setPage,
  });
  const exportCount = useVocabularyCategoryExportCount({
    authVersion,
    categories,
    selectedCategory,
  });
  const legacyImport = useLegacyVocabularyImport({ isAdmin, refreshWords, refreshPage: pageData.refreshPage });

  const pagination = useVocabularyContentPagination({
    page,
    pageSize,
    authVersion,
    loadedAuthVersion: pageData.loadedAuthVersion,
    totalWords: pageData.totalWords,
    pageWords: pageData.pageWords,
    setPageWords: pageData.setPageWords,
    setIsPageLoading: pageData.setIsPageLoading,
    setPage,
    setPageSize: filters.setPageSize,
    refreshPage: pageData.refreshPage,
  });
  const { currentPageWords } = pagination;
  const selection = useVocabularySelection(currentPageWords, authVersion);
  const controller = useVocabularyContentController({
    selectedIds: selection.selectedIds,
    setSelectedIds: selection.setSelectedIds,
    setPageWords: pageData.setPageWords,
    setIsPageLoading: pageData.setIsPageLoading,
    setPage,
    setSearch: filters.setSearch,
    setCategory: filters.setCategory,
    setStatus: filters.setStatus,
    setIsExportCountLoading: exportCount.setIsLoading,
    refreshPage: pageData.refreshPage,
    addWord,
    updateWord,
    deleteWord,
    deleteWords,
    toggleMastered,
  });

  return {
    data: {
      categories,
      words,
      categoriesLoaded,
      authVersion,
      loadedAuthVersion: pageData.loadedAuthVersion,
      isPageLoading: pageData.isPageLoading,
      currentPageWords,
    },
    filters: {
      search: filters.search,
      status: filters.status,
      pageSize,
      selectedCategory,
      handleSearchChange: controller.handleSearchChange,
      handleCategoryChange: controller.handleCategoryChange,
      handleStatusChange: controller.handleStatusChange,
    },
    export: {
      count: exportCount.count,
      isLoading: exportCount.isLoading,
      loadWords: () => loadVocabularyExportWords(selectedCategory, currentPageWords),
    },
    import: {
      hasPendingImport: legacyImport.hasPendingImport,
      importPreview: legacyImport.importPreview,
      isImporting: legacyImport.isImporting,
      showImportPreview: legacyImport.showImportPreview,
      togglePreview: legacyImport.togglePreview,
      importVocabulary: legacyImport.importVocabulary,
      handleComplete: pagination.handleImportComplete,
    },
    selection: {
      selectedIds: selection.selectedIds,
      selectPageRef: selection.selectPageRef,
      isPageSelected: selection.isPageSelected,
      isPagePartiallySelected: selection.isPagePartiallySelected,
      toggleSelected: selection.toggleSelected,
      togglePageSelection: selection.togglePageSelection,
    },
    pagination: {
      visibleTotalWords: pagination.visibleTotalWords,
      pageCount: pagination.pageCount,
      currentPage: pagination.currentPage,
      firstVisibleWord: pagination.firstVisibleWord,
      lastVisibleWord: pagination.lastVisibleWord,
      changePageSize: pagination.changePageSize,
      goToPreviousPage: pagination.goToPreviousPage,
      goToNextPage: pagination.goToNextPage,
    },
    dialogs: {
      isFormOpen: controller.isFormOpen,
      isCategoriesOpen: controller.isCategoriesOpen,
      setIsCategoriesOpen: controller.setIsCategoriesOpen,
      editingWord: controller.editingWord,
      deletingWord: controller.deletingWord,
      setDeletingWord: controller.setDeletingWord,
      isSubmitting: controller.isSubmitting,
      isBulkDeleting: controller.isBulkDeleting,
    },
    actions: {
      handleOpenAdd: controller.handleOpenAdd,
      handleEditWord: controller.handleEditWord,
      handleCloseForm: controller.handleCloseForm,
      handleDeleteWord: controller.handleDeleteWord,
      handleBulkDelete: controller.handleBulkDelete,
      handleConfirmDelete: controller.handleConfirmDelete,
      handleSubmitWord: controller.handleSubmitWord,
      handleToggleMastered: controller.handleToggleMastered,
    },
  };
}

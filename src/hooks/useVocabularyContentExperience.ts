import { useVocabulary } from "@/contexts/VocabularyContext";
import { useVocabularySelection } from "@/hooks/useVocabularySelection";
import { useVocabularyPageData } from "@/hooks/useVocabularyPageData";
import { useVocabularyContentFilters } from "@/hooks/useVocabularyContentFilters";
import { useVocabularyCategoryExportCount } from "@/hooks/useVocabularyCategoryExportCount";
import { useLegacyVocabularyImport } from "@/hooks/useLegacyVocabularyImport";
import { useVocabularyContentController } from "@/hooks/useVocabularyContentController";
import { useVocabularyContentPagination } from "@/hooks/useVocabularyContentPagination";
import { getVocabularyWordsForCategory } from "@/lib/supabase/vocabulary";
import { mapVocabularyWordRow } from "@/lib/vocabulary/shared-vocabulary";

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
    pageWordCount: pageData.pageWords.length,
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

  async function loadExportWords() {
    if (selectedCategory === "All") return currentPageWords;
    const rows = await getVocabularyWordsForCategory(selectedCategory);
    return rows.map(mapVocabularyWordRow);
  }

  return {
    categories,
    words,
    categoriesLoaded,
    authVersion,
    ...filters,
    ...pageData,
    ...exportCount,
    ...legacyImport,
    ...selection,
    ...controller,
    loadExportWords,
    changePageSize: pagination.changePageSize,
    goToPreviousPage: pagination.goToPreviousPage,
    goToNextPage: pagination.goToNextPage,
    visibleTotalWords: pagination.visibleTotalWords,
    pageCount: pagination.pageCount,
    currentPage: pagination.currentPage,
    currentPageWords,
    firstVisibleWord: pagination.firstVisibleWord,
    lastVisibleWord: pagination.lastVisibleWord,
    handleImportComplete: pagination.handleImportComplete,
  };
}

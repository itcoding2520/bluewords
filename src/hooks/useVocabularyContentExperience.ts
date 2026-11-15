import { useVocabulary } from "@/contexts/VocabularyContext";
import { useVocabularySelection } from "@/hooks/useVocabularySelection";
import { useVocabularyPageData } from "@/hooks/useVocabularyPageData";
import { useVocabularyContentFilters } from "@/hooks/useVocabularyContentFilters";
import { useVocabularyCategoryExportCount } from "@/hooks/useVocabularyCategoryExportCount";
import { useLegacyVocabularyImport } from "@/hooks/useLegacyVocabularyImport";
import { useVocabularyContentController } from "@/hooks/useVocabularyContentController";
import { getVocabularyWordsForCategory } from "@/lib/supabase/vocabulary";
import { mapVocabularyWordRow } from "@/lib/vocabulary/shared-vocabulary";
import { getPageCount, getPageRange } from "@/lib/pagination";

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

  const visibleTotalWords = pageData.loadedAuthVersion === authVersion ? pageData.totalWords : 0;
  const pageCount = getPageCount(visibleTotalWords, pageSize);
  const currentPage = Math.min(page, pageCount);
  const pageRange = getPageRange(visibleTotalWords, currentPage, pageSize);
  const currentPageWords = pageData.loadedAuthVersion === authVersion ? pageData.pageWords : [];
  const selection = useVocabularySelection(currentPageWords, authVersion);
  const firstVisibleWord = pageRange.first;
  const lastVisibleWord = pageRange.last;
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

  function changePageSize(size: number) {
    filters.setPageSize(size);
    setPage(1);
    pageData.setIsPageLoading(true);
    pageData.setPageWords([]);
  }

  function goToPreviousPage() {
    pageData.setIsPageLoading(true);
    pageData.setPageWords([]);
    setPage((current) => Math.max(1, current - 1));
  }

  function goToNextPage() {
    pageData.setIsPageLoading(true);
    pageData.setPageWords([]);
    setPage((current) => Math.min(pageCount, current + 1));
  }

  function handleImportComplete() {
    setPage(1);
    pageData.setIsPageLoading(true);
    pageData.refreshPage();
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
    handleImportComplete,
    changePageSize,
    goToPreviousPage,
    goToNextPage,
    visibleTotalWords,
    pageCount,
    currentPage,
    currentPageWords,
    firstVisibleWord,
    lastVisibleWord,
  };
}

import type { Dispatch, SetStateAction } from "react";
import type { VocabularyWord } from "@/data/vocabulary";
import { getPageCount, getPageRange } from "@/lib/pagination";

export function useVocabularyContentPagination({
  page,
  pageSize,
  authVersion,
  loadedAuthVersion,
  totalWords,
  pageWords,
  setPageWords,
  setIsPageLoading,
  setPage,
  setPageSize,
  refreshPage,
}: {
  page: number;
  pageSize: number;
  authVersion: number;
  loadedAuthVersion: number | null;
  totalWords: number;
  pageWords: VocabularyWord[];
  setPageWords: Dispatch<SetStateAction<VocabularyWord[]>>;
  setIsPageLoading: Dispatch<SetStateAction<boolean>>;
  setPage: Dispatch<SetStateAction<number>>;
  setPageSize: (size: number) => void;
  refreshPage: () => void;
}) {
  const visibleTotalWords = loadedAuthVersion === authVersion ? totalWords : 0;
  const pageCount = getPageCount(visibleTotalWords, pageSize);
  const currentPage = Math.min(page, pageCount);
  const pageRange = getPageRange(visibleTotalWords, currentPage, pageSize);
  const currentPageWords = loadedAuthVersion === authVersion ? pageWords : [];

  function changePageSize(size: number) {
    setPageSize(size);
    setPage(1);
    setIsPageLoading(true);
    setPageWords([]);
  }

  function goToPreviousPage() {
    setIsPageLoading(true);
    setPageWords([]);
    setPage((current) => Math.max(1, current - 1));
  }

  function goToNextPage() {
    setIsPageLoading(true);
    setPageWords([]);
    setPage((current) => Math.min(pageCount, current + 1));
  }

  function handleImportComplete() {
    setPage(1);
    setIsPageLoading(true);
    refreshPage();
  }

  return {
    visibleTotalWords,
    pageCount,
    currentPage,
    currentPageWords,
    firstVisibleWord: pageRange.first,
    lastVisibleWord: pageRange.last,
    changePageSize,
    goToPreviousPage,
    goToNextPage,
    handleImportComplete,
  };
}

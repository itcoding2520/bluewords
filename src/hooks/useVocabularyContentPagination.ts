import type { Dispatch, SetStateAction } from "react";
import type { VocabularyWord } from "@/data/vocabulary";
import { getNextPage, getPageMetadata, getPreviousPage } from "@/lib/pagination";

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
  const pageMetadata = getPageMetadata(visibleTotalWords, page, pageSize);
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
    setPage((current) => getPreviousPage(current));
  }

  function goToNextPage() {
    setIsPageLoading(true);
    setPageWords([]);
    setPage((current) => getNextPage(current, pageMetadata.pageCount));
  }

  function handleImportComplete() {
    setPage(1);
    setIsPageLoading(true);
    refreshPage();
  }

  return {
    visibleTotalWords,
    pageCount: pageMetadata.pageCount,
    currentPage: pageMetadata.currentPage,
    currentPageWords,
    firstVisibleWord: pageMetadata.first,
    lastVisibleWord: pageMetadata.last,
    changePageSize,
    goToPreviousPage,
    goToNextPage,
    handleImportComplete,
  };
}

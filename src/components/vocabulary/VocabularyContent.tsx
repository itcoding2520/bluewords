"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import {
  previewVocabularyImport,
  importLegacyVocabulary,
} from "@/lib/vocabulary-import";
import { toast } from "sonner";
import {
  type VocabularyWord,
} from "@/data/vocabulary";

import { WordFormModal } from "./WordFormModal";
import { VocabularyHeader } from "./VocabularyHeader";
import { VocabularyList } from "./VocabularyList";
import { VocabularyToolbar } from "./VocabularyToolbar";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { ManageCategoriesModal } from "./ManageCategoriesModal";
import { VocabularyCsvTools } from "./VocabularyCsvTools";
import type {
  CategoryFilter,
} from "./VocabularyToolbar";
import { useVocabulary } from "@/contexts/VocabularyContext";
import { Button } from "@/components/ui/Button";
import { getVocabularyWordPage, getVocabularyWords, getVocabularyWordsForCategory, type VocabularyWordWithMeaningsRow } from "@/lib/supabase/vocabulary";
import {
  getCachedVocabularyPage,
  setCachedVocabularyPage,
} from "@/lib/supabase/vocabulary-page-cache.mjs";

function mapPageWord(row: VocabularyWordWithMeaningsRow): VocabularyWord {
  return {
    id: row.id,
    word: row.word,
    meaning: row.meaning,
    category: row.category as VocabularyWord["category"],
    status: row.status,
    type: row.type ?? "word",
    ipa: row.ipa ?? null,
    imagePath: row.image_path ?? null,
    detailedMeanings: (row.vocabulary_meanings ?? []).map((meaning) => ({
      id: meaning.id,
      partOfSpeech: meaning.part_of_speech,
      meaning: meaning.meaning,
    })),
  };
}

export function VocabularyContent() {
  const {
    categories,
    categoriesLoaded,
    addWord,
    updateWord,
    deleteWord,
    deleteWords,
    toggleMastered,
    refreshWords,
    authVersion,
  } = useVocabulary({ loadWords: false });
  const initialCachedPage = getCachedVocabularyPage(authVersion, {
    page: 1,
    pageSize: 10,
    search: "",
    category: null,
  }) as { rows: VocabularyWord[]; total: number } | null;
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<VocabularyWord | null>(null);
  const [deletingWord, setDeletingWord] = useState<VocabularyWord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set()
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pageWords, setPageWords] = useState<VocabularyWord[]>(
    () => initialCachedPage?.rows ?? []
  );
  const [loadedAuthVersion, setLoadedAuthVersion] = useState<number | null>(
    () => initialCachedPage ? authVersion : null
  );
  const [totalWords, setTotalWords] = useState(
    () => initialCachedPage?.total ?? 0
  );
  const [isPageLoading, setIsPageLoading] = useState(!initialCachedPage);
  const [pageRequest, setPageRequest] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [legacyCloudWords, setLegacyCloudWords] = useState<VocabularyWord[]>([]);
  const [hasLegacyData, setHasLegacyData] = useState(false);
  const [categoryExportCount, setCategoryExportCount] = useState(0);
  const [isExportCountLoading, setIsExportCountLoading] = useState(false);
  const pageRequestId = useRef(0);
  const loadedAuthVersionRef = useRef<number | null>(null);
  const selectPageRef = useRef<HTMLInputElement>(null);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setHasLegacyData(previewVocabularyImport([]).total > 0);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const importPreview = useMemo(() => {
    if (!hasLegacyData) return null;
    return previewVocabularyImport(legacyCloudWords);
  }, [hasLegacyData, legacyCloudWords]);

  const hasPendingImport =
  importPreview !== null &&
  importPreview.ready.length > 0;

  const selectedCategory =
    category === "All" ||
    categories.some((item) => item.name === category)
      ? category
      : "All";

  async function handleImportVocabulary() {
    if (isImporting || !importPreview || importPreview.ready.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      `Import ${importPreview.ready.length} words into your account?\n\n` +
        "Your old localStorage data will be kept."
    );

    if (!confirmed) return;

    setIsImporting(true);

    try {
      const result = await importLegacyVocabulary(legacyCloudWords);

      // Đọc lại dữ liệu cloud để Dashboard và Vocabulary cập nhật.
      await refreshWords();
      setPageRequest((value) => value + 1);

      if (result.failed === 0) {
        setShowImportPreview(false);
      }

      if (result.imported > 0) {
        toast.success(`Imported ${result.imported} words successfully!`);
      }

      if (result.duplicates > 0) {
        toast.info(`Skipped ${result.duplicates} duplicate words.`);
      }

      if (result.failed > 0) {
        toast.error(`${result.failed} words could not be imported.`);
      }
    } catch (error) {
      console.error("Vocabulary import error:", error);
      toast.error("Failed to import vocabulary.");
    } finally {
      setIsImporting(false);
    }
  }

  const visibleTotalWords = loadedAuthVersion === authVersion ? totalWords : 0;
  const pageCount = Math.max(1, Math.ceil(visibleTotalWords / pageSize));
  const currentPage = Math.min(page, pageCount);
  const currentPageWords = loadedAuthVersion === authVersion ? pageWords : [];
  const selectedOnPage = currentPageWords.filter((word) =>
    selectedIds.has(word.id)
  ).length;
  const isPageSelected =
    currentPageWords.length > 0 && selectedOnPage === currentPageWords.length;
  const isPagePartiallySelected =
    selectedOnPage > 0 && selectedOnPage < currentPageWords.length;
  const firstVisibleWord =
    visibleTotalWords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastVisibleWord = Math.min(
    currentPage * pageSize,
    visibleTotalWords
  );

  useEffect(() => {
    if (!categoriesLoaded) return;
    const requestId = ++pageRequestId.current;
    let cancelled = false;
    const query = {
      page: currentPage,
      pageSize,
      search: debouncedSearch,
      category: selectedCategory === "All" ? null : selectedCategory,
    };
    const cachedPage = getCachedVocabularyPage(authVersion, query) as {
      rows: VocabularyWord[];
      total: number;
    } | null;
    const pageResult = cachedPage
      ? Promise.resolve(cachedPage)
      : getVocabularyWordPage(query).then((result) => {
          const mappedResult = {
            rows: result.rows.map(mapPageWord),
            total: result.total,
          };
          setCachedVocabularyPage(authVersion, query, mappedResult);
          return mappedResult;
        });
    void pageResult.then((result) => {
      if (cancelled || requestId !== pageRequestId.current) return;
      setTotalWords(result.total);
      const resultPageCount = Math.max(1, Math.ceil(result.total / pageSize));
      if (currentPage > resultPageCount) {
        setPage(resultPageCount);
        return;
      }
      setPageWords(result.rows);
      if (loadedAuthVersionRef.current !== authVersion) {
        loadedAuthVersionRef.current = authVersion;
        setSelectedIds(new Set());
      }
      setLoadedAuthVersion(authVersion);
      setIsPageLoading(false);
    }).catch((error) => {
      if (cancelled || requestId !== pageRequestId.current) return;
      console.error("Failed to load vocabulary page:", error);
      setPageWords([]);
      setTotalWords(0);
      setIsPageLoading(false);
      toast.error("Failed to load vocabulary.");
    });
    return () => { cancelled = true; };
  }, [authVersion, categories, categoriesLoaded, currentPage, debouncedSearch, pageSize, pageRequest, selectedCategory]);

  useEffect(() => {
    if (selectedCategory === "All") return;
    let cancelled = false;
    void getVocabularyWordPage({
      page: 1,
      pageSize: 1,
      search: "",
      category: selectedCategory,
    }).then(({ total }) => {
      if (!cancelled) {
        setCategoryExportCount(total);
        setIsExportCountLoading(false);
      }
    }).catch(() => {
      if (!cancelled) {
        setCategoryExportCount(0);
        setIsExportCountLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [authVersion, categories, pageWords.length, selectedCategory]);

  useEffect(() => {
    if (selectPageRef.current) {
      selectPageRef.current.indeterminate = isPagePartiallySelected;
    }
  }, [isPagePartiallySelected]);

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

  function handleCloseCategories() {
    setIsCategoriesOpen(false);
    setPage(1);
    setSelectedIds(new Set());
    setCategory((current) =>
      current === "All" ||
      categories.some((item) => item.name === current)
        ? current
        : "All"
    );
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

  function handleToggleSelected(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleTogglePageSelection() {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (isPageSelected) {
        currentPageWords.forEach((word) => next.delete(word.id));
      } else {
        currentPageWords.forEach((word) => next.add(word.id));
      }
      return next;
    });
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0 || isBulkDeleting) return;

    const count = selectedIds.size;
    const confirmed = window.confirm(
      `Delete ${count} selected ${count === 1 ? "word" : "words"}? This cannot be undone.`
    );
    if (!confirmed) return;

    setIsBulkDeleting(true);
    try {
      const deletedCount = await deleteWords([...selectedIds]);
      if (deletedCount > 0) {
        setSelectedIds(new Set());
        setIsPageLoading(true);
        setPageRequest((value) => value + 1);
        toast.success(
          `Deleted ${deletedCount} ${deletedCount === 1 ? "word" : "words"}.`
        );
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
        setPageRequest((value) => value + 1);
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

  async function handleSubmitWord(
    submittedWord: VocabularyWord
  ): Promise<boolean> {
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
        setPageRequest((value) => value + 1);
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
      setPageRequest((value) => value + 1);
    }
    return success;
  }


  async function handleLegacyPreviewToggle() {
    if (showImportPreview) {
      setShowImportPreview(false);
      return;
    }
    setShowImportPreview(true);
    try {
      const allWords = await getVocabularyWords();
      setLegacyCloudWords(allWords.map(mapPageWord));
    } catch {
      toast.error("Failed to prepare the legacy vocabulary preview.");
    }
  }

  if (!categoriesLoaded) {
    return (
      <div className="py-16 text-sm text-slate-500">
        Loading vocabulary...
      </div>
    );
  }

  return (
    <>
      <VocabularyHeader
        onAddWord={handleOpenAdd}
        onManageCategories={() => setIsCategoriesOpen(true)}
      />

      {hasPendingImport && (
        <div className="my-6 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Have vocabulary from BlueWords v1.0?
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Import words saved in this browser to your account.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void handleLegacyPreviewToggle()}
              disabled={isImporting}
              className="rounded-lg cursor-pointer border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50 disabled:opacity-50"
            >
              {showImportPreview ? "Hide preview" : "Preview import"}
            </button>
          </div>

          {showImportPreview && importPreview && (
            <div className="mt-4 border-t border-blue-100 pt-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xl font-semibold text-slate-900">
                    {importPreview.total}
                  </p>
                  <p className="text-xs text-slate-500">Old words</p>
                </div>

                <div>
                  <p className="text-xl font-semibold text-slate-900">
                    {importPreview.duplicates}
                  </p>
                  <p className="text-xs text-slate-500">Duplicates</p>
                </div>

                <div>
                  <p className="text-xl font-semibold text-blue-700">
                    {importPreview.ready.length}
                  </p>
                  <p className="text-xs text-slate-500">Ready to import</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  Your browser data will not be deleted.
                </p>

                <button
                  type="button"
                  onClick={() => void handleImportVocabulary()}
                  disabled={isImporting || importPreview.ready.length === 0}
                  className="rounded-lg cursor-pointer bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isImporting
                    ? "Importing..."
                    : `Import ${importPreview.ready.length} words`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <VocabularyCsvTools
        exportCount={selectedCategory === "All" ? currentPageWords.length : categoryExportCount}
        isExportCountLoading={isExportCountLoading}
        loadExportWords={async () => {
          if (selectedCategory === "All") return currentPageWords;
          const rows = await getVocabularyWordsForCategory(selectedCategory);
          return rows.map(mapPageWord);
        }}
        exportCategory={selectedCategory}
        categories={categories}
        onImportComplete={() => {
          setPage(1);
          setIsPageLoading(true);
          setPageRequest((value) => value + 1);
        }}
      />

      <VocabularyToolbar
        search={search}
        category={selectedCategory}
        categories={categories}
        onSearchChange={handleSearchChange}
        onCategoryChange={handleCategoryChange}
      />

      {loadedAuthVersion === authVersion && selectedIds.size > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
            <span aria-live="polite" className="text-sm font-medium text-slate-600">
              {selectedIds.size} selected
            </span>
            <Button
              variant="secondary"
              onClick={() => void handleBulkDelete()}
              disabled={isBulkDeleting}
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 size={16} />
              {isBulkDeleting ? "Deleting..." : "Delete selected"}
            </Button>
        </div>
      )}

      <VocabularyList
        words={currentPageWords}
        isLoading={isPageLoading || loadedAuthVersion !== authVersion}
        selectedIds={selectedIds}
        selectPageRef={selectPageRef}
        isPageSelected={isPageSelected}
        isPagePartiallySelected={isPagePartiallySelected}
        isBulkDeleting={isBulkDeleting}
        onTogglePageSelection={handleTogglePageSelection}
        onToggleSelected={handleToggleSelected}
        onToggleMastered={handleToggleMastered}
        onEdit={handleEditWord}
        onDelete={handleDeleteWord}
      />

      <div className="mt-4 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p aria-live="polite" className="shrink-0">
          Showing {firstVisibleWord}–{lastVisibleWord} of {visibleTotalWords} words
        </p>

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 sm:justify-end">
          <label className="flex items-center gap-2 whitespace-nowrap">
            <span className="relative inline-flex">
              <select
                aria-label="Rows per page"
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                  setIsPageLoading(true);
                  setPageWords([]);
                }}
                className="h-10 w-[76px] cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              >
                {[10, 20, 50].map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500">
                <ChevronDown size={15} />
              </span>
            </span>
          </label>

          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap">Page {currentPage} of {pageCount}</span>
            <Button
              variant="secondary"
              aria-label="Previous page"
              onClick={() => {
                setIsPageLoading(true);
                setPageWords([]);
                setPage((current) => Math.max(1, current - 1));
              }}
              disabled={currentPage <= 1}
              className="size-10 px-0"
            >
              <ChevronLeft size={17} />
            </Button>
            <Button
              variant="secondary"
              aria-label="Next page"
              onClick={() => {
                setIsPageLoading(true);
                setPageWords([]);
                setPage((current) => Math.min(pageCount, current + 1));
              }}
              disabled={currentPage >= pageCount}
              className="size-10 px-0"
            >
              <ChevronRight size={17} />
            </Button>
          </div>
        </div>
      </div>

      {isFormOpen && (
        <WordFormModal
          key={editingWord?.id ?? "new"}
          open={isFormOpen}
          words={currentPageWords}
          categories={categories}
          editingWord={editingWord}
          onClose={handleCloseForm}
          onSubmit={handleSubmitWord}
        />
      )}

      <DeleteConfirmModal
        word={deletingWord}
        isDeleting={isSubmitting}
        onClose={() => setDeletingWord(null)}
        onConfirm={handleConfirmDelete}
      />

      <ManageCategoriesModal
        open={isCategoriesOpen}
        onClose={handleCloseCategories}
      />
    </>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Trash2 } from "lucide-react";
import {
  previewVocabularyImport,
  importLegacyVocabulary,
} from "@/lib/vocabulary-import";
import { toast } from "sonner";
import {
  type VocabularyWord,
} from "@/data/vocabulary";

import { VocabularyHeader } from "./VocabularyHeader";
import { VocabularyList } from "./VocabularyList";
import { VocabularyPagination } from "./VocabularyPagination";
import { VocabularyToolbar } from "./VocabularyToolbar";
import { CommunityVocabulary } from "./CommunityVocabulary";
import type {
  CategoryFilter,
  VocabularyStatusFilter,
} from "./VocabularyToolbar";
import { useVocabulary } from "@/contexts/VocabularyContext";
import { Button } from "@/components/ui/Button";
import { useConfirmDialog } from "@/components/ui/ConfirmDialogProvider";
import { getVocabularyWordPage, getVocabularyWords, getVocabularyWordsForCategory } from "@/lib/supabase/vocabulary";
import { mapVocabularyWordRow } from "@/lib/vocabulary/shared-vocabulary";
import { useVocabularySelection } from "@/hooks/useVocabularySelection";
import { useVocabularyPageData } from "@/hooks/useVocabularyPageData";

const LEGACY_IMPORT_NOTICE_ENABLED = false;

// Keep the vocabulary browsing path lean. These tools are only needed after
// an explicit admin action (or when the user opens a modal).
const WordFormModal = dynamic(() => import("./WordFormModal").then((module) => module.WordFormModal));
const DeleteConfirmModal = dynamic(() => import("./DeleteConfirmModal").then((module) => module.DeleteConfirmModal));
const CategoryManagementPanel = dynamic(() => import("./CategoryManagementPanel").then((module) => module.CategoryManagementPanel));
const VocabularyCsvTools = dynamic(() => import("./VocabularyCsvTools").then((module) => module.VocabularyCsvTools));

export function VocabularyContent({ isAdmin }: { isAdmin: boolean }) {
  const confirmDialog = useConfirmDialog();
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
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [status, setStatus] = useState<VocabularyStatusFilter>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<VocabularyWord | null>(null);
  const [deletingWord, setDeletingWord] = useState<VocabularyWord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [legacyCloudWords, setLegacyCloudWords] = useState<VocabularyWord[]>([]);
  const [hasLegacyData, setHasLegacyData] = useState(false);
  const [categoryExportCount, setCategoryExportCount] = useState(0);
  const [isExportCountLoading, setIsExportCountLoading] = useState(false);
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

  const hasPendingImport = isAdmin &&
  importPreview !== null &&
  importPreview.ready.length > 0;

  const selectedCategory =
    category === "All" ||
    categories.some((item) => item.name === category)
      ? category
      : "All";

  const { pageWords, setPageWords, loadedAuthVersion, totalWords, isPageLoading, setIsPageLoading, refreshPage } = useVocabularyPageData({
    authVersion,
    categories,
    categoriesLoaded,
    query: {
      page,
      pageSize,
      search: debouncedSearch,
      category: selectedCategory === "All" ? null : selectedCategory,
      status: status === "all" ? null : status,
    },
    onPageOutOfRange: setPage,
  });

  async function handleImportVocabulary() {
    if (isImporting || !importPreview || importPreview.ready.length === 0) {
      return;
    }

    const confirmed = await confirmDialog({
      title: "Import vocabulary?",
      description: `Import ${importPreview.ready.length} words into your account? Your old localStorage data will be kept.`,
      confirmLabel: "Import words",
      destructive: false,
    });

    if (!confirmed) return;

    setIsImporting(true);

    try {
      const result = await importLegacyVocabulary(legacyCloudWords);

      // Đọc lại dữ liệu cloud để Dashboard và Vocabulary cập nhật.
      await refreshWords();
      refreshPage();

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
  const {
    selectedIds,
    setSelectedIds,
    selectPageRef,
    isPageSelected,
    isPagePartiallySelected,
    toggleSelected,
    togglePageSelection,
  } = useVocabularySelection(currentPageWords, authVersion);
  const firstVisibleWord =
    visibleTotalWords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastVisibleWord = Math.min(
    currentPage * pageSize,
    visibleTotalWords
  );

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


  async function handleLegacyPreviewToggle() {
    if (showImportPreview) {
      setShowImportPreview(false);
      return;
    }
    setShowImportPreview(true);
    try {
      const allWords = await getVocabularyWords();
      setLegacyCloudWords(allWords.map(mapVocabularyWordRow));
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

  if (isCategoriesOpen) {
    return <>
      <VocabularyHeader activeTab="categories" onAddWord={handleOpenAdd} onManageCategories={() => setIsCategoriesOpen(false)} />
      <div className="mt-6"><CategoryManagementPanel /></div>
    </>;
  }

  return (
    <>
      <VocabularyHeader
        activeTab="words"
        onAddWord={handleOpenAdd}
        onManageCategories={() => setIsCategoriesOpen(true)}
      />

      {LEGACY_IMPORT_NOTICE_ENABLED && hasPendingImport && (
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

      <section className="vocabulary-words-section mt-5 rounded-[1.75rem] border border-blue-100/80 bg-white/80 p-3 shadow-[0_12px_35px_rgb(39_90_150/0.08)] backdrop-blur-sm sm:p-5">
      <div className="vocabulary-toolbar-row flex flex-wrap items-center justify-between gap-3">
      {isAdmin && <VocabularyCsvTools
        exportCount={selectedCategory === "All" ? currentPageWords.length : categoryExportCount}
        isExportCountLoading={isExportCountLoading}
        loadExportWords={async () => {
          if (selectedCategory === "All") return currentPageWords;
          const rows = await getVocabularyWordsForCategory(selectedCategory);
          return rows.map(mapVocabularyWordRow);
        }}
        exportCategory={selectedCategory}
        categories={categories}
        onImportComplete={() => {
          setPage(1);
          setIsPageLoading(true);
          refreshPage();
        }}
      />}

      <VocabularyToolbar
        search={search}
        category={selectedCategory}
        status={status}
        categories={categories}
        words={words}
        onSearchChange={handleSearchChange}
        onCategoryChange={handleCategoryChange}
        onStatusChange={handleStatusChange}
      />
      </div>

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
        onTogglePageSelection={togglePageSelection}
        onToggleSelected={toggleSelected}
        onToggleMastered={handleToggleMastered}
        onEdit={handleEditWord}
        onDelete={handleDeleteWord}
      />

      <VocabularyPagination
        first={firstVisibleWord}
        last={lastVisibleWord}
        total={visibleTotalWords}
        page={currentPage}
        pageCount={pageCount}
        pageSize={pageSize}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
          setIsPageLoading(true);
          setPageWords([]);
        }}
        onPrevious={() => {
          setIsPageLoading(true);
          setPageWords([]);
          setPage((current) => Math.max(1, current - 1));
        }}
        onNext={() => {
          setIsPageLoading(true);
          setPageWords([]);
          setPage((current) => Math.min(pageCount, current + 1));
        }}
      />
      </section>

      <CommunityVocabulary />

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

      {deletingWord && <DeleteConfirmModal
          word={deletingWord}
          isDeleting={isSubmitting}
          onClose={() => setDeletingWord(null)}
          onConfirm={handleConfirmDelete}
        />}

    </>
  );
}

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

export function VocabularyContent() {
  const {
    words,
    categories,
    isLoaded,
    addWord,
    updateWord,
    deleteWord,
    deleteWords,
    toggleMastered,
    refreshWords,
  } = useVocabulary();
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
  const selectPageRef = useRef<HTMLInputElement>(null);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const importPreview = useMemo(() => {
    if (!isLoaded) {
      return null;
    }

    return previewVocabularyImport(words);
  }, [words, isLoaded]);

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
      const result = await importLegacyVocabulary(words);

      // Đọc lại dữ liệu cloud để Dashboard và Vocabulary cập nhật.
      await refreshWords();

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

  const filteredWords = useMemo(() => {
    return words.filter((item) => {
      const query = search.toLowerCase();

      const matchesSearch =
        item.word.toLowerCase().includes(query) ||
        item.meaning.toLowerCase().includes(query);

      const matchesCategory =
        selectedCategory === "All" ||
        item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [words, search, selectedCategory]);

  const pageCount = Math.max(1, Math.ceil(filteredWords.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageWords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredWords.slice(start, start + pageSize);
  }, [filteredWords, currentPage, pageSize]);
  const selectedOnPage = pageWords.filter((word) =>
    selectedIds.has(word.id)
  ).length;
  const isPageSelected =
    pageWords.length > 0 && selectedOnPage === pageWords.length;
  const isPagePartiallySelected =
    selectedOnPage > 0 && selectedOnPage < pageWords.length;
  const firstVisibleWord =
    filteredWords.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastVisibleWord = Math.min(
    currentPage * pageSize,
    filteredWords.length
  );

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
    setPage(1);
    setSelectedIds(new Set());
  }

  function handleCategoryChange(value: CategoryFilter) {
    setCategory(value);
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
        pageWords.forEach((word) => next.delete(word.id));
      } else {
        pageWords.forEach((word) => next.add(word.id));
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
        handleCloseForm();
      }
      return success;
    } finally {
      setIsSubmitting(false);
    }
  }


  if (!isLoaded) {
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
              onClick={() => setShowImportPreview((current) => !current)}
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

      <VocabularyCsvTools words={words} categories={categories} />

      <VocabularyToolbar
        search={search}
        category={selectedCategory}
        categories={categories}
        onSearchChange={handleSearchChange}
        onCategoryChange={handleCategoryChange}
      />

      {selectedIds.size > 0 && (
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
        words={pageWords}
        selectedIds={selectedIds}
        selectPageRef={selectPageRef}
        isPageSelected={isPageSelected}
        isPagePartiallySelected={isPagePartiallySelected}
        isBulkDeleting={isBulkDeleting}
        onTogglePageSelection={handleTogglePageSelection}
        onToggleSelected={handleToggleSelected}
        onToggleMastered={toggleMastered}
        onEdit={handleEditWord}
        onDelete={handleDeleteWord}
      />

      <div className="mt-4 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p aria-live="polite" className="shrink-0">
          Showing {firstVisibleWord}–{lastVisibleWord} of {filteredWords.length} words
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
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={currentPage <= 1}
              className="size-10 px-0"
            >
              <ChevronLeft size={17} />
            </Button>
            <Button
              variant="secondary"
              aria-label="Next page"
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
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
          words={words}
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

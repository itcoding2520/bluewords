"use client";

import { useMemo, useState } from "react";
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
import type {
  CategoryFilter,
} from "./VocabularyToolbar";
import { useVocabulary } from "@/contexts/VocabularyContext";

export function VocabularyContent() {
  const {
    words,
    categories,
    isLoaded,
    addWord,
    updateWord,
    deleteWord,
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

  
  async function handleConfirmDelete() {
    if (!deletingWord || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const success = await deleteWord(deletingWord.id);

      if (success) {
        setDeletingWord(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmitWord(
    submittedWord: VocabularyWord
  ) {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const success = editingWord
        ? await updateWord(submittedWord)
        : await addWord(submittedWord);

      if (success) {
        handleCloseForm();
      }
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

      <VocabularyToolbar
        search={search}
        category={selectedCategory}
        categories={categories}
        onSearchChange={setSearch}
        onCategoryChange={setCategory}
      />

      <VocabularyList
        words={filteredWords}
        onToggleMastered={toggleMastered}
        onEdit={handleEditWord}
        onDelete={handleDeleteWord}
      />

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

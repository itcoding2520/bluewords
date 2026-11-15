"use client";

import dynamic from "next/dynamic";
import { Trash2 } from "lucide-react";
import { VocabularyHeader } from "./VocabularyHeader";
import { VocabularyList } from "./VocabularyList";
import { VocabularyPagination } from "./VocabularyPagination";
import { VocabularyToolbar } from "./VocabularyToolbar";
import { CommunityVocabulary } from "./CommunityVocabulary";
import { Button } from "@/components/ui/Button";
import { useVocabularyContentExperience } from "@/hooks/useVocabularyContentExperience";

const LEGACY_IMPORT_NOTICE_ENABLED = false;

// Keep the vocabulary browsing path lean. These tools are only needed after
// an explicit admin action (or when the user opens a modal).
const WordFormModal = dynamic(() => import("./WordFormModal").then((module) => module.WordFormModal));
const DeleteConfirmModal = dynamic(() => import("./DeleteConfirmModal").then((module) => module.DeleteConfirmModal));
const CategoryManagementPanel = dynamic(() => import("./CategoryManagementPanel").then((module) => module.CategoryManagementPanel));
const VocabularyCsvTools = dynamic(() => import("./VocabularyCsvTools").then((module) => module.VocabularyCsvTools));

export function VocabularyContent({ isAdmin }: { isAdmin: boolean }) {
  const {
    categories,
    words,
    categoriesLoaded,
    authVersion,
    search,
    status,
    setPage,
    pageSize,
    setPageSize,
    selectedCategory,
    count: categoryExportCount,
    isLoading: isExportCountLoading,
    hasPendingImport,
    importPreview,
    isImporting,
    showImportPreview,
    togglePreview: handleLegacyPreviewToggle,
    importVocabulary: handleImportVocabulary,
    selectedIds,
    selectPageRef,
    isPageSelected,
    isPagePartiallySelected,
    toggleSelected,
    togglePageSelection,
    currentPageWords,
    loadedAuthVersion,
    visibleTotalWords,
    pageCount,
    currentPage,
    firstVisibleWord,
    lastVisibleWord,
    isPageLoading,
    setIsPageLoading,
    setPageWords,
    isFormOpen,
    isCategoriesOpen,
    setIsCategoriesOpen,
    editingWord,
    deletingWord,
    setDeletingWord,
    isSubmitting,
    isBulkDeleting,
    handleOpenAdd,
    handleEditWord,
    handleCloseForm,
    handleDeleteWord,
    handleSearchChange,
    handleCategoryChange,
    handleStatusChange,
    handleBulkDelete,
    handleConfirmDelete,
    handleSubmitWord,
    handleToggleMastered,
    loadExportWords,
    handleImportComplete,
  } = useVocabularyContentExperience(isAdmin);


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
        loadExportWords={loadExportWords}
        exportCategory={selectedCategory}
        categories={categories}
        onImportComplete={handleImportComplete}
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
        categories={categories}
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

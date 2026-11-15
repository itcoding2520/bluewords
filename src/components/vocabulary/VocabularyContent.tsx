"use client";

import dynamic from "next/dynamic";
import { VocabularyHeader } from "./VocabularyHeader";
import { VocabularyList } from "./VocabularyList";
import { VocabularyPagination } from "./VocabularyPagination";
import { CommunityVocabulary } from "./CommunityVocabulary";
import { VocabularyLegacyImportNotice } from "./VocabularyLegacyImportNotice";
import { VocabularyBrowserToolbar } from "./VocabularyBrowserToolbar";
import { VocabularyBulkActions } from "@/components/vocabulary/VocabularyBulkActions";
import { VocabularyWordDialogs } from "@/components/vocabulary/VocabularyWordDialogs";
import { useVocabularyContentExperience } from "@/hooks/useVocabularyContentExperience";

const LEGACY_IMPORT_NOTICE_ENABLED = false;

const CategoryManagementPanel = dynamic(() => import("./CategoryManagementPanel").then((module) => module.CategoryManagementPanel));

export function VocabularyContent({ isAdmin }: { isAdmin: boolean }) {
  const {
    data: {
      categories, words, categoriesLoaded, authVersion, loadedAuthVersion,
      isPageLoading, currentPageWords,
    },
    filters: {
      search, status, pageSize, selectedCategory, handleSearchChange,
      handleCategoryChange, handleStatusChange,
    },
    export: {
      count: categoryExportCount, isLoading: isExportCountLoading,
      loadWords: loadExportWords,
    },
    import: {
      hasPendingImport, importPreview, isImporting, showImportPreview,
      togglePreview: handleLegacyPreviewToggle,
      importVocabulary: handleImportVocabulary,
      handleComplete: handleImportComplete,
    },
    selection: {
      selectedIds, selectPageRef, isPageSelected, isPagePartiallySelected,
      toggleSelected, togglePageSelection,
    },
    pagination: {
      visibleTotalWords, pageCount, currentPage, firstVisibleWord,
      lastVisibleWord, changePageSize, goToPreviousPage, goToNextPage,
    },
    dialogs: {
      isFormOpen, isCategoriesOpen, setIsCategoriesOpen, editingWord,
      deletingWord, setDeletingWord, isSubmitting, isBulkDeleting,
    },
    actions: {
      handleOpenAdd, handleEditWord, handleCloseForm, handleDeleteWord,
      handleBulkDelete, handleConfirmDelete, handleSubmitWord,
      handleToggleMastered,
    },
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
        <VocabularyLegacyImportNotice
          importPreview={importPreview}
          isImporting={isImporting}
          showImportPreview={showImportPreview}
          onTogglePreview={() => void handleLegacyPreviewToggle()}
          onImport={() => void handleImportVocabulary()}
        />
      )}

      <section className="vocabulary-words-section mt-5 rounded-[1.75rem] border border-blue-100/80 bg-white/80 p-3 shadow-[0_12px_35px_rgb(39_90_150/0.08)] backdrop-blur-sm sm:p-5">
      <VocabularyBrowserToolbar
        isAdmin={isAdmin}
        exportCount={selectedCategory === "All" ? currentPageWords.length : categoryExportCount}
        isExportCountLoading={isExportCountLoading}
        loadExportWords={loadExportWords}
        exportCategory={selectedCategory}
        categories={categories}
        words={words}
        search={search}
        status={status}
        onSearchChange={handleSearchChange}
        onCategoryChange={handleCategoryChange}
        onStatusChange={handleStatusChange}
        onImportComplete={handleImportComplete}
      />

      {loadedAuthVersion === authVersion && (
        <VocabularyBulkActions
          selectedCount={selectedIds.size}
          isDeleting={isBulkDeleting}
          onDelete={() => void handleBulkDelete()}
        />
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
        onPageSizeChange={changePageSize}
        onPrevious={goToPreviousPage}
        onNext={goToNextPage}
      />
      </section>

      <CommunityVocabulary />

      <VocabularyWordDialogs
        isFormOpen={isFormOpen}
        words={currentPageWords}
        categories={categories}
        editingWord={editingWord}
        onCloseForm={handleCloseForm}
        onSubmitWord={handleSubmitWord}
        deletingWord={deletingWord}
        isDeleting={isSubmitting}
        onCloseDelete={() => setDeletingWord(null)}
        onConfirmDelete={handleConfirmDelete}
      />

    </>
  );
}

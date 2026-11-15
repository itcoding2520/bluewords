"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { useAdminCategoryManagementController } from "@/hooks/useAdminCategoryManagementController";
import { AdminCategoryTabs } from "@/components/admin/AdminCategoryTabs";
import { AdminCategoryListPanel } from "@/components/admin/AdminCategoryListPanel";
import { AdminCategoryDetailPanel } from "@/components/admin/AdminCategoryDetailPanel";

export function AdminCategoryManagement() {
  const {
    activeTab, setActiveTab, setSelectedId, categorySearch, setCategorySearch,
    communityCategories, emails, words, wordEmails, wordsLoading, loading, error,
    currentCategories, visibleCategories, visibleCategoryRows, selectedCategory,
    defaultWords, selectedSharedCategory, selectedFallbackImage, refresh,
    editSharedCategory, removeSharedCategory, editSharedWord, removeSharedWord,
  } = useAdminCategoryManagementController();

    return <div className="admin-category-page">
    <AdminNavigation active="categories" />
    <header className="admin-category-hero">
      <div className="admin-category-hero-copy">
        <p className="text-sm font-semibold text-sky-600">Administration</p>
        <h1 className="page-title mt-1">Category management</h1>
        <p className="page-intro-description mt-2">Browse starter and community categories,<br className="hidden sm:block" /> then open one to review its words.</p>
      </div>
      <Button variant="secondary" onClick={() => void refresh()} disabled={loading}><RefreshCw size={17} /> Refresh</Button>
    </header>

    {error && <AutoDismissMessage key={error} variant="error" className="mb-4">{error}</AutoDismissMessage>}

    <AdminCategoryTabs
      activeTab={activeTab}
      communityCategories={communityCategories}
      onChange={(tab) => {
        setActiveTab(tab);
        setSelectedId("");
        setCategorySearch("");
      }}
    />

    <div className="admin-category-layout grid items-start gap-5 lg:grid-cols-[minmax(260px,0.85fr)_minmax(0,1.65fr)]">
      <AdminCategoryListPanel
        activeTab={activeTab}
        loading={loading}
        categorySearch={categorySearch}
        currentCategories={currentCategories}
        visibleCategories={visibleCategories}
        visibleCategoryRows={visibleCategoryRows}
        selectedCategory={selectedCategory}
        onSearchChange={setCategorySearch}
        onSelect={setSelectedId}
      />

      <AdminCategoryDetailPanel
        activeTab={activeTab}
        selectedCategory={selectedCategory}
        selectedSharedCategory={selectedSharedCategory}
        selectedFallbackImage={selectedFallbackImage}
        emails={emails}
        defaultWords={defaultWords}
        words={words}
        wordEmails={wordEmails}
        wordsLoading={wordsLoading}
        onEditCategory={(category) => void editSharedCategory(category)}
        onRemoveCategory={(category) => void removeSharedCategory(category)}
        onEditWord={(word) => void editSharedWord(word)}
        onRemoveWord={(word) => void removeSharedWord(word)}
      />
    </div>
  </div>;
}

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
  const { selection, data, view, actions } = useAdminCategoryManagementController();

  return <div className="admin-category-page">
    <AdminNavigation active="categories" />
    <header className="admin-category-hero">
      <div className="admin-category-hero-copy">
        <p className="text-sm font-semibold text-sky-600">Administration</p>
        <h1 className="page-title mt-1">Category management</h1>
        <p className="page-intro-description mt-2">Browse starter and community categories,<br className="hidden sm:block" /> then open one to review its words.</p>
      </div>
      <Button variant="secondary" onClick={() => void actions.refresh()} disabled={data.loading}><RefreshCw size={17} /> Refresh</Button>
    </header>

    {data.error && <AutoDismissMessage key={data.error} variant="error" className="mb-4">{data.error}</AutoDismissMessage>}

    <AdminCategoryTabs
      activeTab={selection.activeTab}
      communityCategories={data.communityCategories}
      onChange={selection.changeTab}
    />

    <div className="admin-category-layout grid items-start gap-5 lg:grid-cols-[minmax(260px,0.85fr)_minmax(0,1.65fr)]">
      <AdminCategoryListPanel
        activeTab={selection.activeTab}
        loading={data.loading}
        categorySearch={selection.categorySearch}
        currentCategories={view.currentCategories}
        visibleCategories={view.visibleCategories}
        visibleCategoryRows={view.visibleCategoryRows}
        selectedCategory={view.selectedCategory}
        onSearchChange={selection.setCategorySearch}
        onSelect={selection.setSelectedId}
      />

      <AdminCategoryDetailPanel
        activeTab={selection.activeTab}
        selectedCategory={view.selectedCategory}
        selectedSharedCategory={view.selectedSharedCategory}
        selectedFallbackImage={view.selectedFallbackImage}
        emails={data.emails}
        defaultWords={view.defaultWords}
        words={data.words}
        wordEmails={data.wordEmails}
        wordsLoading={data.wordsLoading}
        onEditCategory={(category) => void actions.editSharedCategory(category)}
        onRemoveCategory={(category) => void actions.removeSharedCategory(category)}
        onEditWord={(word) => void actions.editSharedWord(word)}
        onRemoveWord={(word) => void actions.removeSharedWord(word)}
      />
    </div>
  </div>;
}

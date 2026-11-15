"use client";

import Image from "next/image";
import { BookOpen, CheckCircle2, Clock3, Pencil, RefreshCw, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { defaultVocabularyCategories } from "@/data/default-vocabulary";
import { CategoryAvatar } from "@/components/vocabulary/CategoryAvatar";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { useVocabularyImageUrl } from "@/hooks/useVocabularyImageUrl";
import { formatShortDate } from "@/lib/formatDate";
import { useAdminCategoryManagementController, type CategoryTab } from "@/hooks/useAdminCategoryManagementController";

const tabs: Array<{ id: CategoryTab; label: string; description: string; icon: typeof BookOpen }> = [
  { id: "default", label: "Default", description: "Starter categories and words", icon: BookOpen },
  { id: "published", label: "Custom published", description: "Visible to signed-in users", icon: CheckCircle2 },
  { id: "pending", label: "Custom waiting publish", description: "Awaiting admin approval", icon: Clock3 },
];

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

    <div role="tablist" aria-label="Category type" className="admin-category-tabs mb-5 grid gap-2 sm:grid-cols-3">
      {tabs.map(({ id, label, description, icon: Icon }) => {
        const count = id === "default" ? defaultVocabularyCategories.length : communityCategories.filter((category) => category.status === (id === "pending" ? "pending" : "published")).length;
        const active = activeTab === id;
        return <button key={id} role="tab" aria-selected={active} onClick={() => { setActiveTab(id); setSelectedId(""); setCategorySearch(""); }} className={`admin-category-tab flex min-w-0 items-center gap-3 rounded-2xl border p-4 text-left transition ${active ? "is-selected border-blue-300 bg-blue-50 ring-1 ring-blue-200" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"}`}>
          <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}><Icon size={19} /></span>
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-900">{label}</span><span className="mt-0.5 block text-xs text-slate-500">{description}</span></span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${active ? "bg-white text-blue-700" : "bg-slate-100 text-slate-600"}`}>{count}</span>
        </button>;
      })}
    </div>

    <div className="admin-category-layout grid items-start gap-5 lg:grid-cols-[minmax(260px,0.85fr)_minmax(0,1.65fr)]">
      <section className="admin-category-list-panel overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="admin-category-list-heading"><h2><BookOpen size={19} />{tabs.find((tab) => tab.id === activeTab)?.label} categories</h2></div>
        <label className="admin-category-search"><Search size={17} /><input value={categorySearch} onChange={(event) => setCategorySearch(event.target.value)} placeholder="Search categories…" aria-label="Search categories" /></label>
        {loading ? <p className="p-5 text-sm text-slate-500">Loading categories…</p> : visibleCategories.length === 0 ? <p className="p-5 text-sm text-slate-500">{currentCategories.length ? "No categories match your search." : "No categories in this tab yet."}</p> : <ul className="admin-category-list max-h-[65vh] divide-y divide-slate-100 overflow-y-auto">
          {visibleCategoryRows.map(({ category, shared, owner, fallbackImage, defaultWordCount, createdAt }) => {
            const active = category.id === selectedCategory?.id;
            return <li key={category.id}>
              <button onClick={() => setSelectedId(category.id)} aria-current={active ? "true" : undefined} className={`admin-category-list-item flex w-full items-start gap-3 px-4 py-3 text-left transition ${active ? "is-selected bg-blue-50" : "hover:bg-slate-50"}`}>
                <CategoryAvatar name={category.name} imagePath={shared?.image_path} fallbackWordImagePath={fallbackImage} colorClass={active ? "bg-blue-100" : "bg-slate-200"} />
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-900">{category.name}</span>{owner && <span className="mt-1 block truncate text-xs text-slate-500">{owner}</span>}</span>
                <span className="mt-1 text-xs text-slate-400">{defaultWordCount ?? (createdAt ? formatShortDate(createdAt, "Date unavailable") : "")}</span>
              </button>
            </li>;
          })}
        </ul>}
      </section>

      <section className="admin-category-detail min-h-72 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
        {!selectedCategory ? <div className="grid min-h-64 place-items-center text-center text-sm text-slate-500">Choose a category to see its words.</div> : <>
          <div className="admin-category-detail-header flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex min-w-0 items-center gap-3"><CategoryAvatar name={selectedCategory.name} imagePath={selectedSharedCategory?.image_path} fallbackWordImagePath={selectedFallbackImage} sizeClass="size-12" /><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-blue-600">{activeTab === "default" ? "Default category" : activeTab === "pending" ? "Waiting publish" : "Published custom category"}</p><h2 className="mt-1 break-words text-xl font-bold text-slate-950">{selectedCategory.name}</h2>{selectedSharedCategory && <p className="mt-1 break-all text-sm text-slate-500">Created by {emails[selectedSharedCategory.owner_id] ?? "Loading owner…"}</p>}</div></div>
            {activeTab !== "default" && "created_at" in selectedCategory && <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">Created {formatShortDate(selectedCategory.created_at, "Date unavailable")}</span>}
            {(() => { const shared = activeTab === "default" ? communityCategories.find((item) => item.status === "published" && item.name.trim().toLocaleLowerCase() === selectedCategory.name.trim().toLocaleLowerCase()) : "owner_id" in selectedCategory ? selectedCategory : null; return shared ? <ActionMenu label={shared.name} actions={[{ label: "Edit", icon: <Pencil size={15} />, onSelect: () => void editSharedCategory(shared) }, { label: "Remove", icon: <Trash2 size={15} />, onSelect: () => void removeSharedCategory(shared), destructive: true }]} /> : null; })()}
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-slate-800">Words ({activeTab === "default" ? defaultWords.length : words.length})</h3>
            {wordsLoading ? <p className="py-8 text-center text-sm text-slate-500">Loading words…</p> : (activeTab === "default" ? defaultWords.length + words.length : words.length) === 0 ? <div className="mt-3 rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">This category has no words yet.</div> : <ul className="mt-3 divide-y divide-slate-100">
              {activeTab === "default" && defaultWords.map((word) => <li key={word.id} className="admin-category-word-row"><AdminWordThumbnail word={word.word} imagePath={word.imagePath} /><div className="min-w-0 flex-1"><p className="font-semibold text-slate-900">{word.word}</p><p className="mt-0.5 text-sm text-slate-500">{word.meaning}</p></div><span className="admin-category-word-status">Default</span></li>)}
              {words.map((word) => <li key={word.id} className="admin-category-word-row"><AdminWordThumbnail word={word.word} imagePath={word.image_path} /><div className="min-w-0 flex-1"><p className="font-semibold text-slate-900">{word.word}</p><p className="mt-0.5 text-sm text-slate-500">{word.meaning || "No meaning provided"}</p><p className="mt-1 text-xs text-slate-500">Added by {wordEmails[word.owner_id] ?? "Loading author…"}</p></div><span className={`admin-category-word-status ${word.status === "pending" ? "is-pending" : ""}`}>{activeTab === "default" ? "Custom · Published" : word.status === "pending" ? "Waiting publish" : word.status}</span><ActionMenu label={word.word} actions={[{ label: "Edit", icon: <Pencil size={15} />, onSelect: () => void editSharedWord(word) }, { label: "Remove", icon: <Trash2 size={15} />, onSelect: () => void removeSharedWord(word), destructive: true }]} /></li>)}
            </ul>}
          </div>
        </>}
      </section>
    </div>
  </div>;
}

function AdminWordThumbnail({ word, imagePath }: { word: string; imagePath?: string | null }) {
  const imageUrl = useVocabularyImageUrl(imagePath);
  return imageUrl
    ? <Image src={imageUrl} alt="" width={48} height={48} unoptimized className="admin-category-word-image" />
    : <span className="admin-category-word-image admin-category-word-fallback" aria-hidden="true">{word.slice(0, 1).toUpperCase()}</span>;
}

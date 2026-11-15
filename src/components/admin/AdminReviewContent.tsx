"use client";

import { LoaderCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { useAdminReviewController } from "@/hooks/useAdminReviewController";
import { AdminReviewPendingRequests } from "@/components/admin/AdminReviewPendingRequests";
import { AdminReviewPublishedVocabulary } from "@/components/admin/AdminReviewPublishedVocabulary";

export function AdminReviewContent() {
  const {
    categories, words, loading, error, busy, blockedWordId,
    publishedCategories, publishedWords, ownerEmails,
    newCategory, setNewCategory, newWord, setNewWord,
    newMeaning, setNewMeaning, newWordCategory, setNewWordCategory,
    refresh, moderate, addPublishedCategory, addPublishedWord,
    removePublished, editPublishedWord, editPublishedCategory,
  } = useAdminReviewController();

  return <div className="admin-review-page">
    <AdminNavigation active="requests" />
    <div aria-busy={busy !== null} className="admin-review-content relative">
    <header className="admin-review-hero">
      <div className="admin-review-hero-copy"><p className="text-sm font-semibold text-blue-600">Administration</p><h1 className="page-title mt-1">Publish requests</h1><p className="page-intro-description mt-2">Approved submissions become part of the shared vocabulary visible to everyone, including guests.</p></div>
      <Button variant="secondary" onClick={() => void refresh()} disabled={loading}><RefreshCw size={17} /> Refresh</Button>
    </header>
    {error && <AutoDismissMessage key={error} variant="error" className="mb-4">{error}</AutoDismissMessage>}
    <AdminReviewPendingRequests
      categories={categories}
      words={words}
      loading={loading}
      busy={busy}
      blockedWordId={blockedWordId}
      ownerEmails={ownerEmails}
      onModerate={moderate}
    />
    <AdminReviewPublishedVocabulary
      categories={publishedCategories}
      words={publishedWords}
      ownerEmails={ownerEmails}
      newCategory={newCategory}
      onNewCategoryChange={setNewCategory}
      newWord={newWord}
      onNewWordChange={setNewWord}
      newMeaning={newMeaning}
      onNewMeaningChange={setNewMeaning}
      newWordCategory={newWordCategory}
      onNewWordCategoryChange={setNewWordCategory}
      onAddCategory={addPublishedCategory}
      onAddWord={addPublishedWord}
      onRemove={removePublished}
      onEditCategory={editPublishedCategory}
      onEditWord={editPublishedWord}
    />
    {busy && <div className="absolute inset-0 z-40 grid place-items-center rounded-2xl bg-white/70 backdrop-blur-[1px]" role="status" aria-live="polite"><div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-white px-5 py-4 text-sm font-semibold text-slate-800 shadow-lg"><LoaderCircle size={20} className="animate-spin text-blue-600" />Saving review decision…</div></div>}
    </div>
  </div>;
}

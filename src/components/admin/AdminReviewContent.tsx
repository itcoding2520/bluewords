"use client";

import { BookOpen, FolderOpen, LoaderCircle, Pencil, Plus, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { defaultVocabularyCategories } from "@/data/default-vocabulary";
import { CategoryIdentity } from "@/components/vocabulary/CategoryAvatar";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { Select } from "@/components/ui/Select";
import { useAdminReviewController } from "@/hooks/useAdminReviewController";
import { normalizeVocabularyLabel } from "@/lib/vocabulary/normalize-text";
import { AdminReviewPendingRequests } from "@/components/admin/AdminReviewPendingRequests";

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
    <section className="admin-review-published mt-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="admin-review-published-title"><Sparkles size={22} /> Published custom vocabulary</h2>
      <form className="admin-review-category-form mt-4 flex flex-wrap gap-2" onSubmit={(event) => { event.preventDefault(); void addPublishedCategory(); }}><input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="New category name" aria-label="New category name" className="min-w-48 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /><Button type="submit"><Plus size={16} /> Add category</Button></form>
      <form className="admin-review-word-form mt-3 grid gap-2 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); void addPublishedWord(); }}><Select value={newWordCategory} onChange={(event) => setNewWordCategory(event.target.value)} aria-label="Word category" containerClassName="admin-review-category-select" className="admin-review-category-select-control"><option value="">Choose category</option>{publishedCategories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select><input value={newWord} onChange={(event) => setNewWord(event.target.value)} placeholder="English word" aria-label="English word" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /><input value={newMeaning} onChange={(event) => setNewMeaning(event.target.value)} placeholder="Meaning" aria-label="Word meaning" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /><Button type="submit" disabled={!newWordCategory || !newWord.trim()}><Plus size={16} /> Add word</Button></form>
      <div className="admin-review-published-lists mt-5 grid gap-4 lg:grid-cols-2"><div className="admin-review-published-list"><h3><FolderOpen size={18} /> Categories</h3><ul className="mt-2 divide-y divide-slate-100">{publishedCategories.filter((item) => !defaultVocabularyCategories.some((category) => normalizeVocabularyLabel(category.name) === normalizeVocabularyLabel(item.name))).map((item) => <li key={item.id} className="flex items-center justify-between gap-2 py-2 text-sm"><CategoryIdentity name={item.name} imagePath={item.image_path} fallbackWordImagePath={publishedWords.find((word) => word.category_id === item.id && word.image_path)?.image_path} author={ownerEmails[item.owner_id] ?? "Loading author…"} /><ActionMenu label={item.name} actions={[{ label: "Edit", icon: <Pencil size={15} />, onSelect: () => void editPublishedCategory(item) }, { label: "Remove", icon: <Trash2 size={15} />, onSelect: () => void removePublished("community_categories", item), destructive: true }]} /></li>)}</ul></div><div className="admin-review-published-list"><h3><BookOpen size={18} /> Words</h3><ul className="mt-2 divide-y divide-slate-100">{publishedWords.map((item) => <li key={item.id} className="flex items-center justify-between gap-2 py-2 text-sm"><span className="min-w-0"><strong>{item.word}</strong><span className="ml-2 text-slate-500">{item.meaning}</span><span className="block text-xs text-slate-500">Added by {ownerEmails[item.owner_id] ?? "Loading author…"}</span></span><ActionMenu label={item.word} actions={[{ label: "Edit", icon: <Pencil size={15} />, onSelect: () => void editPublishedWord(item) }, { label: "Remove", icon: <Trash2 size={15} />, onSelect: () => void removePublished("community_words", item), destructive: true }]} /></li>)}</ul></div></div>
    </section>
    {busy && <div className="absolute inset-0 z-40 grid place-items-center rounded-2xl bg-white/70 backdrop-blur-[1px]" role="status" aria-live="polite"><div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-white px-5 py-4 text-sm font-semibold text-slate-800 shadow-lg"><LoaderCircle size={20} className="animate-spin text-blue-600" />Saving review decision…</div></div>}
    </div>
  </div>;
}

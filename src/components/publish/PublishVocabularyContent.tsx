"use client";

import { BookOpen, FolderHeart, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { normalize, usePublishVocabularyController } from "@/hooks/usePublishVocabularyController";

export function PublishVocabularyContent() {
  const {
    isLoaded,
    isAuthenticated,
    selectedCategories,
    selectedWordIds,
    setSelectedWordIds,
    busy,
    status,
    requestsLoaded,
    communityCategoryRequests,
    communityWordRequests,
    communityCategoryNames,
    requestableCategories,
    userWords,
    sendCategoryRequests,
    sendWordRequests,
    toggleCategoryRequest,
  } = usePublishVocabularyController();

  if (!isLoaded) return <p className="py-12 text-center text-slate-600">Checking your session…</p>;
  if (!isAuthenticated) return <p className="py-12 text-center text-slate-600">Sign in to submit vocabulary for publishing.</p>;

  return <div className="publish-vocabulary-page">
    <header className="mb-6"><p className="text-sm font-semibold text-blue-600">Community vocabulary</p><h1 className="page-title mt-1">Send category or word requests</h1><p className="page-intro-description mt-2">Select multiple items to send requests together. Admins review them before they become visible to everyone, including guests.</p></header>
    {status && <AutoDismissMessage key={status} variant="success" className="mb-4">{status}</AutoDismissMessage>}
    <div className="publish-request-grid">
      <Card className="publish-request-card publish-category-card p-5 sm:p-6">
        <div className="publish-request-heading"><span className="publish-request-icon publish-category-icon"><FolderHeart size={29} /></span><div><h2>Category requests</h2><p>Selecting a category also selects its available words.</p></div><Sparkles className="publish-sparkle" size={22} /></div>
        <div className="publish-request-list mt-4 max-h-64 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-3">
          {!requestsLoaded ? <p className="text-sm text-slate-500">Loading request status…</p> : requestableCategories.length ? requestableCategories.map((item) => (
            <label key={item.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <input type="checkbox" checked={selectedCategories.includes(item.name)} onChange={(event) => toggleCategoryRequest(item.name, event.target.checked)} />
              <span>{item.name}</span>
              {communityCategoryRequests.some((request) => normalize(request.name) === normalize(item.name) && request.status === "rejected") && <span className="text-xs text-amber-700">Rejected · resubmittable</span>}
            </label>
          )) : <div className="publish-empty-state"><span className="publish-empty-illustration publish-folder-illustration">📁<span>⭐</span></span><h3>No categories ready to request.</h3><p>Custom categories you can submit for community approval will appear here.</p></div>}
        </div>
        <Button className="publish-send-button mt-4" onClick={() => void sendCategoryRequests()} disabled={!selectedCategories.length || busy}><Send size={16} /> {busy ? "Sending requests…" : "Send category requests"}</Button>
      </Card>
      <Card className="publish-request-card publish-word-card p-5 sm:p-6">
        <div className="publish-request-heading"><span className="publish-request-icon publish-word-icon"><BookOpen size={29} /></span><div><h2>Word requests</h2><p>Choose words you added to your own vocabulary, including words in default categories.</p></div><Sparkles className="publish-sparkle" size={22} /></div>
        <div className="publish-request-list mt-4 max-h-64 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-3">
          {!requestsLoaded ? <p className="text-sm text-slate-500">Loading request status…</p> : userWords.length ? userWords.map((item) => (
            <label key={item.id} className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <input type="checkbox" checked={selectedWordIds.includes(item.id)} onChange={(event) => setSelectedWordIds((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))} />
              <span>{item.word} <span className="text-slate-500">· {item.category}{item.meaning ? ` — ${item.meaning}` : ""}</span>
                {communityWordRequests.some((request) => request.status === "rejected" && communityCategoryNames.get(request.category_id) === normalize(item.category) && normalize(request.normalized_word) === normalize(item.word)) && <span className="ml-2 text-xs text-amber-700">Rejected · resubmittable</span>}
              </span>
            </label>
          )) : <div className="publish-empty-state"><span className="publish-empty-illustration publish-word-illustration">Aa<span>✦</span></span><h3>No words ready to request.</h3><p>Words from your vocabulary that are eligible for community approval will appear here.</p></div>}
        </div>
        <Button className="publish-send-button publish-word-send mt-4" onClick={() => void sendWordRequests()} disabled={!selectedWordIds.length || busy}><Send size={16} /> {busy ? "Sending requests…" : "Send word requests"}</Button>
      </Card>
    </div>
    <aside className="publish-request-note"><span>💡</span><p>You can request added words from your custom categories and the default categories.<br className="hidden sm:block" /> Only one English word can be published in a given category.</p></aside>
  </div>;
}

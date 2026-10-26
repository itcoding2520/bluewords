"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, CheckCircle2, Clock3, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { defaultVocabularyCategories, defaultVocabularyWords } from "@/data/default-vocabulary";
import { createClient } from "@/lib/supabase/client";
import { getAdminCachedData, invalidateAdminDataCache } from "@/lib/admin-data-cache.mjs";
import { Button } from "@/components/ui/Button";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { CategoryAvatar } from "@/components/vocabulary/CategoryAvatar";

type CategoryTab = "default" | "published" | "pending";
type CommunityCategory = {
  id: string;
  owner_id: string;
  name: string;
  color: string;
  status: "pending" | "published";
  created_at: string;
  image_path: string | null;
};
type CommunityWord = {
  id: string;
  owner_id: string;
  category_id: string;
  word: string;
  meaning: string;
  status: string;
  created_at: string;
  image_path: string | null;
};
type AdminUser = { id: string; email: string | null };

const tabs: Array<{ id: CategoryTab; label: string; description: string; icon: typeof BookOpen }> = [
  { id: "default", label: "Default", description: "Starter categories and words", icon: BookOpen },
  { id: "published", label: "Custom published", description: "Visible to signed-in users", icon: CheckCircle2 },
  { id: "pending", label: "Custom waiting publish", description: "Awaiting admin approval", icon: Clock3 },
];

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}

export function AdminCategoryManagement() {
  const [supabase] = useState(() => createClient());
  const [activeTab, setActiveTab] = useState<CategoryTab>("default");
  const [selectedId, setSelectedId] = useState("");
  const [communityCategories, setCommunityCategories] = useState<CommunityCategory[]>([]);
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [words, setWords] = useState<CommunityWord[]>([]);
  const [wordEmails, setWordEmails] = useState<Record<string, string>>({});
  const [wordsLoading, setWordsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const customCategories = useMemo(
    () => communityCategories.filter((category) => category.status === (activeTab === "pending" ? "pending" : "published")
      && !defaultVocabularyCategories.some((item) => item.name.trim().toLocaleLowerCase() === category.name.trim().toLocaleLowerCase())),
    [activeTab, communityCategories],
  );
  const currentCategories = activeTab === "default" ? defaultVocabularyCategories : customCategories;
  const selectedCategory = currentCategories.find((category) => category.id === selectedId) ?? currentCategories[0] ?? null;

  const refresh = useCallback(async (force = true) => {
    setLoading(true);
    setError("");
    if (force) invalidateAdminDataCache();
    try {
      const result = await getAdminCachedData("admin:categories:list", async () => {
        const { data, error: loadError } = await supabase
          .from("community_categories")
          .select("id, owner_id, name, color, status, created_at, image_path")
          .in("status", ["published", "pending"])
          .order("name");
        if (loadError) throw loadError;

        const loadedCategories = (data ?? []) as CommunityCategory[];
        const ownerIds = [...new Set(loadedCategories.map((category) => category.owner_id))];
        const usersById: Record<string, string> = {};
        for (let start = 0; start < ownerIds.length; start += 100) {
          const ownerBatch = ownerIds.slice(start, start + 100);
          const response = await fetch(`/api/admin/users?ids=${ownerBatch.join(",")}`);
          const payload = await response.json() as { users?: AdminUser[]; error?: string };
          if (!response.ok) throw new Error(payload.error ?? "Could not load category owners.");
          for (const user of payload.users ?? []) usersById[user.id] = user.email ?? "No email";
        }
        return { categories: loadedCategories, emails: usersById };
      }, { force });
      setCommunityCategories(result.categories);
      setEmails(result.emails);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load categories.");
      setCommunityCategories([]);
      setEmails({});
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh(false); }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  useEffect(() => {
    if (!selectedCategory) return;

    const sharedCategory = activeTab === "default"
      ? communityCategories.find((category) => category.status === "published" && category.name.trim().toLocaleLowerCase() === selectedCategory.name.trim().toLocaleLowerCase())
      : selectedCategory;
    if (!sharedCategory) {
      const timer = window.setTimeout(() => { setWords([]); setWordEmails({}); setWordsLoading(false); }, 0);
      return () => window.clearTimeout(timer);
    }

    let cancelled = false;
    const loadWords = async () => {
      setWordsLoading(true);
      setError("");
      try {
        const result = await getAdminCachedData(`admin:categories:words:${sharedCategory.id}:${activeTab}`, async () => {
          const { data, error: loadError } = await supabase
            .from("community_words")
            .select("id, owner_id, category_id, word, meaning, status, created_at, image_path")
            .eq("category_id", sharedCategory.id)
            .eq("status", activeTab === "pending" ? "pending" : "published")
            .order("word");
          if (loadError) throw loadError;
          const loadedWords = (data ?? []) as CommunityWord[];
          const ownerIds = [...new Set(loadedWords.map((word) => word.owner_id))];
          const ownerEmails: Record<string, string> = {};
          for (let start = 0; start < ownerIds.length; start += 100) {
            const response = await fetch(`/api/admin/users?ids=${ownerIds.slice(start, start + 100).join(",")}`);
            const payload = await response.json() as { users?: AdminUser[]; error?: string };
            if (!response.ok) throw new Error(payload.error ?? "Could not load word authors.");
            for (const user of payload.users ?? []) ownerEmails[user.id] = user.email ?? "No email";
          }
          return { words: loadedWords, emails: ownerEmails };
        });
        if (cancelled) return;
        setWords(result.words);
        setWordEmails(result.emails);
      } catch (cause) {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : "Could not load words.");
        setWords([]);
        setWordEmails({});
      }
      setWordsLoading(false);
    };
    const timer = window.setTimeout(() => { void loadWords(); }, 0);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [activeTab, communityCategories, selectedCategory, supabase]);

  const defaultWords = activeTab === "default" && selectedCategory
    ? defaultVocabularyWords.filter((word) => word.category === selectedCategory.name)
    : [];
  const selectedSharedCategory = selectedCategory
    ? activeTab === "default"
      ? communityCategories.find((item) => item.status === "published" && item.name.trim().toLocaleLowerCase() === selectedCategory.name.trim().toLocaleLowerCase()) ?? null
      : "owner_id" in selectedCategory ? selectedCategory : null
    : null;
  const selectedFallbackImage = defaultWords.find((word) => word.imagePath)?.imagePath
    ?? words.find((word) => word.image_path)?.image_path
    ?? null;

  async function editSharedCategory(category: CommunityCategory) {
    const name = window.prompt("Category name", category.name)?.trim();
    if (!name || name === category.name) return;
    const { error: updateError } = await supabase.from("community_categories").update({ name }).eq("id", category.id);
    if (updateError) setError(updateError.message);
    else await refresh();
  }

  async function removeSharedCategory(category: CommunityCategory) {
    if (!window.confirm(`Remove “${category.name}” and its published words?`)) return;
    const { error: deleteError } = await supabase.from("community_categories").delete().eq("id", category.id);
    if (deleteError) setError(deleteError.message);
    else { setSelectedId(""); await refresh(); }
  }

  async function editSharedWord(word: CommunityWord) {
    const nextWord = window.prompt("Word", word.word)?.trim();
    if (!nextWord) return;
    const meaning = window.prompt("Meaning", word.meaning)?.trim();
    if (meaning == null || (nextWord === word.word && meaning === word.meaning)) return;
    const { error: updateError } = await supabase.from("community_words").update({ word: nextWord, meaning }).eq("id", word.id);
    if (updateError) setError(updateError.message);
    else { invalidateAdminDataCache(); setWords((current) => current.map((item) => item.id === word.id ? { ...item, word: nextWord, meaning } : item)); }
  }

  async function removeSharedWord(word: CommunityWord) {
    if (!window.confirm(`Remove “${word.word}”?`)) return;
    const { error: deleteError } = await supabase.from("community_words").delete().eq("id", word.id);
    if (deleteError) setError(deleteError.message);
    else { invalidateAdminDataCache(); setWords((current) => current.filter((item) => item.id !== word.id)); }
  }

  return <div>
    <AdminNavigation active="categories" />
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="mt-4 text-sm font-medium text-blue-600">Administration</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950">Category management</h1>
        <p className="mt-2 text-sm text-slate-500">Browse starter and community categories, then open one to review its words.</p>
      </div>
      <Button variant="secondary" onClick={() => void refresh()} disabled={loading}><RefreshCw size={16} /> Refresh</Button>
    </header>

    {error && <AutoDismissMessage key={error} variant="error" className="mb-4">{error}</AutoDismissMessage>}

    <div role="tablist" aria-label="Category type" className="mb-5 grid gap-2 sm:grid-cols-3">
      {tabs.map(({ id, label, description, icon: Icon }) => {
        const count = id === "default" ? defaultVocabularyCategories.length : communityCategories.filter((category) => category.status === (id === "pending" ? "pending" : "published")).length;
        const active = activeTab === id;
        return <button key={id} role="tab" aria-selected={active} onClick={() => { setActiveTab(id); setSelectedId(""); }} className={`flex min-w-0 items-center gap-3 rounded-2xl border p-4 text-left transition ${active ? "border-blue-300 bg-blue-50 ring-1 ring-blue-200" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"}`}>
          <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}><Icon size={19} /></span>
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-900">{label}</span><span className="mt-0.5 block text-xs text-slate-500">{description}</span></span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${active ? "bg-white text-blue-700" : "bg-slate-100 text-slate-600"}`}>{count}</span>
        </button>;
      })}
    </div>

    <div className="grid items-start gap-5 lg:grid-cols-[minmax(260px,0.85fr)_minmax(0,1.65fr)]">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3"><h2 className="font-semibold text-slate-900">{tabs.find((tab) => tab.id === activeTab)?.label} categories</h2></div>
        {loading ? <p className="p-5 text-sm text-slate-500">Loading categories…</p> : currentCategories.length === 0 ? <p className="p-5 text-sm text-slate-500">No categories in this tab yet.</p> : <ul className="max-h-[65vh] divide-y divide-slate-100 overflow-y-auto">
          {currentCategories.map((category) => {
            const active = category.id === selectedCategory?.id;
            const shared = activeTab === "default"
              ? communityCategories.find((item) => item.status === "published" && item.name.trim().toLocaleLowerCase() === category.name.trim().toLocaleLowerCase())
              : "owner_id" in category ? category : null;
            const owner = shared ? emails[shared.owner_id] ?? "Loading owner…" : null;
            const fallbackImage = activeTab === "default"
              ? defaultVocabularyWords.find((word) => word.category === category.name && word.imagePath)?.imagePath
              : words.find((word) => word.image_path)?.image_path;
            return <li key={category.id}>
              <button onClick={() => setSelectedId(category.id)} aria-current={active ? "true" : undefined} className={`flex w-full items-start gap-3 px-4 py-3 text-left transition ${active ? "bg-blue-50" : "hover:bg-slate-50"}`}>
                <CategoryAvatar name={category.name} imagePath={shared?.image_path} fallbackWordImagePath={fallbackImage} colorClass={active ? "bg-blue-100" : "bg-slate-200"} />
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-900">{category.name}</span>{owner && <span className="mt-1 block truncate text-xs text-slate-500">{owner}</span>}</span>
                <span className="mt-1 text-xs text-slate-400">{activeTab === "default" ? defaultVocabularyWords.filter((word) => word.category === category.name).length : "owner_id" in category ? formatDate(category.created_at) : ""}</span>
              </button>
            </li>;
          })}
        </ul>}
      </section>

      <section className="min-h-72 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
        {!selectedCategory ? <div className="grid min-h-64 place-items-center text-center text-sm text-slate-500">Choose a category to see its words.</div> : <>
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex min-w-0 items-center gap-3"><CategoryAvatar name={selectedCategory.name} imagePath={selectedSharedCategory?.image_path} fallbackWordImagePath={selectedFallbackImage} sizeClass="size-12" /><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-blue-600">{activeTab === "default" ? "Default category" : activeTab === "pending" ? "Waiting publish" : "Published custom category"}</p><h2 className="mt-1 break-words text-xl font-bold text-slate-950">{selectedCategory.name}</h2>{selectedSharedCategory && <p className="mt-1 break-all text-sm text-slate-500">Created by {emails[selectedSharedCategory.owner_id] ?? "Loading owner…"}</p>}</div></div>
            {activeTab !== "default" && "created_at" in selectedCategory && <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">Created {formatDate(selectedCategory.created_at)}</span>}
            {(() => { const shared = activeTab === "default" ? communityCategories.find((item) => item.status === "published" && item.name.trim().toLocaleLowerCase() === selectedCategory.name.trim().toLocaleLowerCase()) : "owner_id" in selectedCategory ? selectedCategory : null; return shared ? <span className="flex gap-2"><Button type="button" variant="secondary" onClick={() => void editSharedCategory(shared)}><Pencil size={15} /> Edit</Button><Button type="button" variant="secondary" onClick={() => void removeSharedCategory(shared)}><Trash2 size={15} /> Remove</Button></span> : null; })()}
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-slate-800">Words ({activeTab === "default" ? defaultWords.length : words.length})</h3>
            {wordsLoading ? <p className="py-8 text-center text-sm text-slate-500">Loading words…</p> : (activeTab === "default" ? defaultWords.length + words.length : words.length) === 0 ? <div className="mt-3 rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">This category has no words yet.</div> : <ul className="mt-3 divide-y divide-slate-100">
              {activeTab === "default" && defaultWords.map((word) => <li key={word.id} className="flex flex-wrap items-start justify-between gap-2 py-3"><div><p className="font-medium text-slate-900">{word.word}</p><p className="mt-0.5 text-sm text-slate-500">{word.meaning}</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">Default</span></li>)}
              {words.map((word) => <li key={word.id} className="flex flex-wrap items-start justify-between gap-2 py-3"><div><p className="font-medium text-slate-900">{word.word}</p><p className="mt-0.5 text-sm text-slate-500">{word.meaning || "No meaning provided"}</p><p className="mt-1 text-xs text-slate-500">Added by {wordEmails[word.owner_id] ?? "Loading author…"}</p></div><span className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${word.status === "published" ? "bg-emerald-50 text-emerald-700" : word.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{activeTab === "default" ? "Custom · Published" : word.status === "pending" ? "Waiting publish" : word.status}</span><Button type="button" variant="secondary" aria-label={`Edit ${word.word}`} onClick={() => void editSharedWord(word)}><Pencil size={14} /></Button><Button type="button" variant="secondary" aria-label={`Remove ${word.word}`} onClick={() => void removeSharedWord(word)}><Trash2 size={14} /></Button></span></li>)}
            </ul>}
          </div>
        </>}
      </section>
    </div>
  </div>;
}

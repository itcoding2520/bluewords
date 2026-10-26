"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, LoaderCircle, RefreshCw, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getAdminCachedData, invalidateAdminDataCache } from "@/lib/admin-data-cache.mjs";
import { Button } from "@/components/ui/Button";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { defaultVocabularyCategories } from "@/data/default-vocabulary";
import { CategoryAvatar, CategoryIdentity } from "@/components/vocabulary/CategoryAvatar";

type Submission = {
  id: string;
  owner_id: string;
  status: string;
  created_at: string;
  color?: string;
  name?: string;
  word?: string;
  meaning?: string;
  category_id?: string;
  category_name?: string;
  category_status?: string;
  image_path?: string | null;
  category_image_path?: string | null;
  category_color?: string;
};
type PublishedCategory = { id: string; owner_id: string; name: string; color: string; status: string; image_path: string | null };
type PublishedWord = { id: string; owner_id: string; category_id: string; word: string; meaning: string; status: string; image_path: string | null };
type AdminUser = { id: string; email: string | null };

export function AdminReviewContent() {
  const [supabase] = useState(() => createClient());
  const [categories, setCategories] = useState<Submission[]>([]);
  const [words, setWords] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [blockedWordId, setBlockedWordId] = useState<string | null>(null);
  const [publishedCategories, setPublishedCategories] = useState<PublishedCategory[]>([]);
  const [publishedWords, setPublishedWords] = useState<PublishedWord[]>([]);
  const [ownerEmails, setOwnerEmails] = useState<Record<string, string>>({});
  const [newCategory, setNewCategory] = useState("");
  const [newWord, setNewWord] = useState("");
  const [newMeaning, setNewMeaning] = useState("");
  const [newWordCategory, setNewWordCategory] = useState("");

  const refresh = useCallback(async (force = true) => {
    setLoading(true);
    setError("");
    if (force) invalidateAdminDataCache();
    try {
      const result = await getAdminCachedData("admin:review:all", async () => {
        const [categoryResult, wordResult] = await Promise.all([
          supabase.from("community_categories").select("id, owner_id, name, color, image_path, status, created_at").eq("status", "pending").order("created_at"),
          supabase.from("community_words").select("id, owner_id, word, meaning, category_id, status, created_at, community_categories!inner(name, status, image_path, color)").eq("status", "pending").order("created_at"),
        ]);
        if (categoryResult.error || wordResult.error) throw categoryResult.error ?? wordResult.error;
        const pendingCategories = (categoryResult.data ?? []) as Submission[];
        const pendingWords = ((wordResult.data ?? []) as unknown as Array<Submission & { community_categories: { name: string; status: string; image_path: string | null; color: string } }>).map(({ community_categories, ...item }) => ({ ...item, category_name: community_categories.name, category_status: community_categories.status, category_image_path: community_categories.image_path, category_color: community_categories.color }));
        const [publishedCategoryResult, publishedWordResult] = await Promise.all([
          supabase.from("community_categories").select("id, owner_id, name, color, image_path, status").eq("status", "published").order("name"),
          supabase.from("community_words").select("id, owner_id, category_id, word, meaning, status, image_path").eq("status", "published").order("word"),
        ]);
        if (publishedCategoryResult.error || publishedWordResult.error) throw publishedCategoryResult.error ?? publishedWordResult.error;
        const liveCategories = (publishedCategoryResult.data ?? []) as PublishedCategory[];
        const liveWords = (publishedWordResult.data ?? []) as PublishedWord[];
        const ownerIds = [...new Set([...pendingCategories, ...pendingWords, ...liveCategories, ...liveWords].map((item) => item.owner_id))];
        const nextEmails: Record<string, string> = {};
        for (let start = 0; start < ownerIds.length; start += 100) {
          const response = await fetch(`/api/admin/users?ids=${ownerIds.slice(start, start + 100).join(",")}`);
          const payload = await response.json() as { users?: AdminUser[]; error?: string };
          if (!response.ok) throw new Error(payload.error ?? "Could not load submission authors.");
          for (const user of payload.users ?? []) nextEmails[user.id] = user.email ?? "No email";
        }
        return { categories: pendingCategories, words: pendingWords, publishedCategories: liveCategories, publishedWords: liveWords, ownerEmails: nextEmails };
      }, { force });
      setCategories(result.categories);
      setWords(result.words);
      setPublishedCategories(result.publishedCategories);
      setPublishedWords(result.publishedWords);
      setOwnerEmails(result.ownerEmails);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load requests.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh(false); }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  useEffect(() => {
    if (!blockedWordId) return;
    const timer = window.setTimeout(() => setBlockedWordId(null), 3000);
    return () => window.clearTimeout(timer);
  }, [blockedWordId]);

  async function moderate(table: "community_categories" | "community_words", id: string, status: "published" | "rejected") {
    if (table === "community_words" && status === "published") {
      const word = words.find((item) => item.id === id);
      if (word && word.category_status !== "published") {
        setBlockedWordId(id);
        return;
      }
    }
    setBlockedWordId(null);
    setBusy(id);
    setError("");
    try {
      const { error: updateError } = await supabase.from(table).update({ status }).eq("id", id);
      if (updateError) {
        setError(updateError.code === "23505" ? "A published category or word with that name already exists." : updateError.message);
        return;
      }

      invalidateAdminDataCache();
      if (table === "community_categories") {
        const category = categories.find((item) => item.id === id);
        setCategories((current) => current.filter((item) => item.id !== id));
        if (category && status === "published") {
          setPublishedCategories((current) => [...current.filter((item) => item.id !== id), {
            id: category.id,
            owner_id: category.owner_id,
            name: category.name ?? "",
            color: category.color ?? "blue",
            status: "published",
            image_path: category.image_path ?? null,
          }]);
        }
        setWords((current) => current.map((item) => item.category_id === id ? { ...item, category_status: status } : item));
      } else {
        const word = words.find((item) => item.id === id);
        setWords((current) => current.filter((item) => item.id !== id));
        if (word && status === "published" && word.category_id && word.word) {
          const publishedWord: PublishedWord = {
            id: word.id,
            owner_id: word.owner_id,
            category_id: word.category_id,
            word: word.word,
            meaning: word.meaning ?? "",
            status: "published",
            image_path: word.image_path ?? null,
          };
          setPublishedWords((current) => [...current.filter((item) => item.id !== id), publishedWord]);
        }
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update this request.");
    } finally {
      setBusy(null);
    }
  }

  async function addPublishedCategory() {
    const name = newCategory.trim();
    if (!name) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error: insertError } = await supabase.from("community_categories").insert({ owner_id: user.id, name, color: "blue", status: "published" });
    if (insertError) setError(insertError.code === "23505" ? "That category already exists." : insertError.message);
    else { setNewCategory(""); await refresh(); }
  }

  async function addPublishedWord() {
    const word = newWord.trim();
    if (!word || !newWordCategory) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error: insertError } = await supabase.from("community_words").insert({ owner_id: user.id, category_id: newWordCategory, word, meaning: newMeaning.trim(), status: "published" });
    if (insertError) setError(insertError.code === "23505" ? "That word already exists in this category." : insertError.message);
    else { setNewWord(""); setNewMeaning(""); await refresh(); }
  }

  async function removePublished(table: "community_categories" | "community_words", item: PublishedCategory | PublishedWord) {
    if (!window.confirm(`Remove “${"name" in item ? item.name : item.word}” from the published vocabulary?`)) return;
    const { error: updateError } = await supabase.from(table).update({ status: "removed" }).eq("id", item.id);
    if (updateError) setError(updateError.message);
    else await refresh();
  }

  async function editPublishedWord(item: PublishedWord) {
    const word = window.prompt("Edit English word", item.word);
    if (word === null || !word.trim()) return;
    const meaning = window.prompt("Edit meaning", item.meaning);
    if (meaning === null) return;
    const { error: updateError } = await supabase.from("community_words").update({ word: word.trim(), meaning: meaning.trim() }).eq("id", item.id);
    if (updateError) setError(updateError.code === "23505" ? "A word with that spelling already exists in this category." : updateError.message);
    else await refresh();
  }

  async function editPublishedCategory(item: PublishedCategory) {
    const name = window.prompt("Edit category name", item.name);
    if (name === null || !name.trim()) return;
    const { error: updateError } = await supabase.from("community_categories").update({ name: name.trim() }).eq("id", item.id);
    if (updateError) setError(updateError.code === "23505" ? "A category with that name already exists." : updateError.message);
    else await refresh();
  }

  return <div>
    <AdminNavigation active="requests" />
    <div aria-busy={busy !== null} className="relative">
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-sm font-medium text-blue-600">Administration</p><h1 className="mt-1 text-2xl font-bold text-slate-950">Publish requests</h1><p className="mt-2 text-sm text-slate-500">Approved submissions become part of the shared vocabulary visible to everyone, including guests.</p></div>
      <Button variant="secondary" onClick={() => void refresh()} disabled={loading}><RefreshCw size={16} /> Refresh</Button>
    </header>
    {error && <AutoDismissMessage key={error} variant="error" className="mb-4">{error}</AutoDismissMessage>}
    {loading ? <p className="py-10 text-center text-slate-500">Loading requests…</p> : <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-semibold text-slate-900">Categories ({categories.length})</h2>{categories.length === 0 ? <p className="py-6 text-sm text-slate-500">No category requests.</p> : <div className="mt-4 space-y-3">{categories.map((item) => <article key={item.id} className="rounded-xl border border-slate-200 p-4"><div className="flex items-center gap-3"><CategoryAvatar name={item.name ?? ""} imagePath={item.image_path} /><div className="min-w-0"><p className="font-medium">{item.name}</p><p className="mt-1 text-xs text-slate-500">By {ownerEmails[item.owner_id] ?? "Loading author…"} · Submitted {new Date(item.created_at).toLocaleString()}</p></div></div><div className="mt-3 flex gap-2"><Button onClick={() => void moderate("community_categories", item.id, "published")} disabled={busy === item.id}><Check size={15} /> Approve</Button><Button variant="secondary" onClick={() => void moderate("community_categories", item.id, "rejected")} disabled={busy === item.id}><X size={15} /> Reject</Button></div></article>)}</div>}</section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-semibold text-slate-900">Words ({words.length})</h2>{words.length === 0 ? <p className="py-6 text-sm text-slate-500">No word requests.</p> : <div className="mt-4 space-y-3">{words.map((item) => <article key={item.id} className="rounded-xl border border-slate-200 p-4"><p className="font-medium">{item.word}</p><p className="mt-1 text-sm text-slate-600">{item.meaning}</p><div className="mt-2 flex items-center gap-2 text-sm text-slate-600"><CategoryAvatar name={item.category_name ?? ""} imagePath={item.category_image_path} colorClass="bg-slate-200" />{item.category_name}</div><p className="mt-1 text-xs text-slate-500">Requested by {ownerEmails[item.owner_id] ?? "Loading author…"} · Submitted {new Date(item.created_at).toLocaleString()}</p><p className={`mt-2 text-xs font-medium ${item.category_status === "published" ? "text-emerald-700" : "text-amber-700"}`}>Category: {item.category_status === "published" ? "Approved" : item.category_status === "rejected" ? "Rejected" : "Waiting for approval"}</p>{blockedWordId === item.id && item.category_status !== "published" && <p role="alert" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{item.category_status === "rejected" ? `Category “${item.category_name}” was rejected. Review or restore that category before approving this word.` : `Approve category “${item.category_name}” before approving this word.`}</p>}<div className="mt-3 flex gap-2"><Button onClick={() => void moderate("community_words", item.id, "published")} disabled={busy === item.id}><Check size={15} /> Approve</Button><Button variant="secondary" onClick={() => void moderate("community_words", item.id, "rejected")} disabled={busy === item.id}><X size={15} /> Reject</Button></div></article>)}</div>}</section>
    </div>}
    <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="font-semibold text-slate-900">Published custom vocabulary</h2>
      <form className="mt-4 flex flex-wrap gap-2" onSubmit={(event) => { event.preventDefault(); void addPublishedCategory(); }}><input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="New category name" aria-label="New category name" className="min-w-48 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /><Button type="submit">Add category</Button></form>
      <form className="mt-3 grid gap-2 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); void addPublishedWord(); }}><select value={newWordCategory} onChange={(event) => setNewWordCategory(event.target.value)} aria-label="Word category" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="">Choose category</option>{publishedCategories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><input value={newWord} onChange={(event) => setNewWord(event.target.value)} placeholder="English word" aria-label="English word" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /><input value={newMeaning} onChange={(event) => setNewMeaning(event.target.value)} placeholder="Meaning" aria-label="Word meaning" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /><Button type="submit" disabled={!newWordCategory || !newWord.trim()}>Add word</Button></form>
      <div className="mt-5 grid gap-4 lg:grid-cols-2"><div><h3 className="text-sm font-semibold text-slate-700">Categories</h3><ul className="mt-2 divide-y divide-slate-100">{publishedCategories.filter((item) => !defaultVocabularyCategories.some((category) => category.name.trim().toLocaleLowerCase() === item.name.trim().toLocaleLowerCase())).map((item) => <li key={item.id} className="flex items-center justify-between gap-2 py-2 text-sm"><CategoryIdentity name={item.name} imagePath={item.image_path} fallbackWordImagePath={publishedWords.find((word) => word.category_id === item.id && word.image_path)?.image_path} author={ownerEmails[item.owner_id] ?? "Loading author…"} /><span className="flex gap-1"><Button variant="secondary" onClick={() => void editPublishedCategory(item)}>Edit</Button><Button variant="secondary" onClick={() => void removePublished("community_categories", item)}><X size={14} /> Remove</Button></span></li>)}</ul></div><div><h3 className="text-sm font-semibold text-slate-700">Words</h3><ul className="mt-2 divide-y divide-slate-100">{publishedWords.map((item) => <li key={item.id} className="flex items-center justify-between gap-2 py-2 text-sm"><span className="min-w-0"><strong>{item.word}</strong><span className="ml-2 text-slate-500">{item.meaning}</span><span className="block text-xs text-slate-500">Added by {ownerEmails[item.owner_id] ?? "Loading author…"}</span></span><span className="flex shrink-0 gap-1"><Button variant="secondary" onClick={() => void editPublishedWord(item)}>Edit</Button><Button variant="secondary" onClick={() => void removePublished("community_words", item)}><X size={14} /> Remove</Button></span></li>)}</ul></div></div>
    </section>
    {busy && <div className="absolute inset-0 z-40 grid place-items-center rounded-2xl bg-white/70 backdrop-blur-[1px]" role="status" aria-live="polite"><div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-white px-5 py-4 text-sm font-semibold text-slate-800 shadow-lg"><LoaderCircle size={20} className="animate-spin text-blue-600" />Saving review decision…</div></div>}
    </div>
  </div>;
}

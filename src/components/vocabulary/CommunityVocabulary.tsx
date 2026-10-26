"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CategoryAvatar } from "@/components/vocabulary/CategoryAvatar";

type CommunityWord = { id: string; word: string; meaning: string; ipa: string | null; image_path: string | null; community_categories: { name: string; image_path: string | null; color: string } };

export function CommunityVocabulary() {
  const [supabase] = useState(() => createClient());
  const [words, setWords] = useState<CommunityWord[]>([]);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      void supabase.from("community_words")
        .select("id, word, meaning, ipa, image_path, community_categories!inner(name, status, image_path, color)")
        .eq("status", "published")
        .eq("community_categories.status", "published")
        .order("word")
        .then(({ data }) => {
          if (active) {
            setWords((data ?? []) as unknown as CommunityWord[]);
            setLoaded(true);
          }
        });
    }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [supabase]);

  const categories = useMemo(() => [...new Set(words.map((item) => item.community_categories.name))].sort((a, b) => a.localeCompare(b)), [words]);
  const visible = useMemo(() => words.filter((item) =>
    (category === "all" || item.community_categories.name === category)
    && (!search.trim() || `${item.word} ${item.meaning}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))
  ), [category, search, words]);

  if (loaded && words.length === 0) return null;

  return <section className="community-vocabulary-section mt-5 rounded-[1.75rem] border border-violet-100 bg-gradient-to-br from-violet-50/90 via-white to-indigo-50/80 p-5 shadow-[0_10px_28px_rgb(78_55_180/0.07)] sm:p-6">
    <div className="community-vocabulary-heading flex flex-wrap items-center justify-between gap-3"><div className="flex min-w-0 items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-violet-100"><Image src="/images/ui/icons/community.png" alt="" width={28} height={28} className="size-7 object-contain" /></span><div className="min-w-0"><h2 className="text-lg font-bold text-indigo-950">Community vocabulary</h2><p className="mt-0.5 text-sm text-slate-500">Approved custom words from other signed-in learners.</p></div></div><span className="community-vocabulary-count rounded-full border border-violet-100 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700">{words.length} words</span></div>
    <div className="community-vocabulary-controls mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"><div className="community-category-select"><select aria-label="Community category" value={category} onChange={(event) => setCategory(event.target.value)} className="community-category-select-input rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="all">All shared categories</option>{categories.map((name) => <option key={name} value={name}>{name}</option>)}</select><ChevronDown className="community-category-chevron" size={17} aria-hidden="true" /></div><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search shared words or meanings" aria-label="Search community vocabulary" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" /></div>
    {!loaded ? <p className="py-6 text-sm text-slate-500">Loading community vocabulary…</p> : visible.length === 0 ? <p className="py-6 text-sm text-slate-500">No matching published words.</p> : <ul className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{visible.map((item) => <li key={item.id} className="rounded-xl border border-indigo-100 bg-white p-3"><div className="flex items-start justify-between gap-2"><span className="font-semibold text-slate-900">{item.word}</span><CategoryAvatar name={item.community_categories.name} imagePath={item.community_categories.image_path} fallbackWordImagePath={visible.find((word) => word.community_categories.name === item.community_categories.name && word.image_path)?.image_path} /></div><p className="mt-1 text-xs font-medium text-indigo-700">{item.community_categories.name}</p><p className="mt-1 text-sm text-slate-600">{item.meaning}</p>{item.ipa && <p className="mt-1 text-xs text-slate-400">{item.ipa}</p>}</li>)}</ul>}
  </section>;
}

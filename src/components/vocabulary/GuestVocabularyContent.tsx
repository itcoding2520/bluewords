"use client";

import Image from "next/image";
import Link from "next/link";
import type { VocabularyWord } from "@/data/vocabulary";
import { useVocabularyImageUrl } from "@/hooks/useVocabularyImageUrl";
import { useMemo, useState } from "react";
import { Search, Sparkles, Star } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { useVocabulary } from "@/contexts/VocabularyContext";
import { CategoryDropdown } from "@/components/vocabulary/VocabularyToolbar";
import { PronunciationButton } from "@/components/vocabulary/PronunciationButton";
import type { VocabularyCategoryColor } from "@/lib/supabase/categories";

const PAGE_SIZE = 20;
const categoryColors: Record<VocabularyCategoryColor, string> = {
  blue: "bg-blue-100 text-blue-800", violet: "bg-violet-100 text-violet-800",
  orange: "bg-orange-100 text-orange-800", green: "bg-emerald-100 text-emerald-800",
  rose: "bg-rose-100 text-rose-800", indigo: "bg-indigo-100 text-indigo-800",
  teal: "bg-teal-100 text-teal-800", amber: "bg-amber-100 text-amber-800",
  pink: "bg-pink-100 text-pink-800", slate: "bg-slate-100 text-slate-700",
};

function GuestWordRow({ word, color }: { word: VocabularyWord; color: VocabularyCategoryColor }) {
  const starterImageUrl = useVocabularyImageUrl(word.imagePath);
  const imageUrl = word.imageUrl ?? starterImageUrl;

  return (
    <li className="guest-vocabulary-row grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-x-4 gap-y-2 px-4 py-3.5 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {imageUrl ? <Image src={imageUrl} alt={`Illustration for ${word.word}`} width={56} height={56} unoptimized className="size-12 shrink-0 rounded-xl border border-slate-100 bg-slate-50 object-cover sm:size-14" /> : <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-blue-50 text-lg font-bold text-blue-400 sm:size-14" aria-hidden="true">{word.word.slice(0, 1).toUpperCase()}</span>}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-1"><p className="break-words font-bold text-slate-900">{word.word}</p><PronunciationButton word={word.word} /></div>
          <span className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{word.type === "expression" ? "Expression" : "Word"}</span>
        </div>
      </div>
      <p className="min-w-0 break-words text-sm leading-5 text-slate-600">{word.meaning}</p>
      <span className={`col-span-2 w-fit rounded-full px-3 py-1.5 text-xs font-semibold sm:col-span-1 ${categoryColors[color]}`}>{word.category}</span>
    </li>
  );
}

export function GuestVocabularyContent() {
  const { words, categories, isLoaded } = useVocabulary();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);

  const filteredWords = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return words.filter((word) => {
      const matchesCategory = category === "all" || word.category === category;
      const matchesQuery = !query || `${word.word} ${word.meaning}`.toLocaleLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [category, search, words]);
  const pageCount = Math.max(1, Math.ceil(filteredWords.length / PAGE_SIZE));
  const pageWords = filteredWords.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const categoryColor = (name: string) => categories.find((item) => item.name === name)?.color ?? "blue";

  return (
    <div className="guest-vocabulary-page">
      <header className="guest-vocabulary-hero mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.12em] text-blue-600"><Sparkles size={14} /> Public vocabulary</p>
          <h1 className="page-title mt-1 flex items-center gap-2">Explore vocabulary <Star className="size-5 fill-amber-400 text-amber-400" /></h1>
          <p className="page-intro-description mt-2 max-w-3xl">Browse starter words and vocabulary approved for everyone.</p>
        </div>
        <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-blue-100 bg-white/85 p-3 shadow-sm sm:px-4 sm:py-3">
          <Star className="size-5 shrink-0 fill-amber-400 text-amber-400" />
          <div className="min-w-0"><p className="text-xs font-bold text-slate-900 sm:text-sm">Want to save your progress?</p><p className="mt-0.5 text-xs text-slate-500">Create a free account to track your learning.</p></div>
          <Link href="/login" className="inline-flex min-h-10 shrink-0 items-center rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700">Sign up</Link>
        </div>
      </header>

      <div className="guest-vocabulary-toolbar flex flex-col gap-2.5 sm:flex-row">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search public vocabulary</span>
          <Search size={17} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search words or meanings…" className="h-11 w-full rounded-2xl border border-slate-200 bg-white/95 pl-10 pr-3 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
        </label>
        <CategoryDropdown category={category} categories={categories} words={words} onChange={(value) => { setCategory(value); setPage(1); }} includeAll allLabel="Select category" />
      </div>

      <Card className="guest-vocabulary-list mt-4 overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-slate-100 bg-white/75 px-4 py-3 sm:px-6"><span className="text-xs font-bold uppercase tracking-wide text-slate-500">{filteredWords.length} public words</span><span className="text-xs text-slate-400">Free to explore</span></div>
        <div className="guest-vocabulary-columns hidden grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] gap-x-4 border-b border-slate-100 bg-slate-50/70 px-6 py-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-400 sm:grid"><span>Word</span><span>Meaning</span><span>Category</span></div>
        {!isLoaded ? <p role="status" className="p-8 text-center text-sm text-slate-500">Loading vocabulary…</p> : pageWords.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">No public words match your search.</p> : <ul className="divide-y divide-slate-100">{pageWords.map((word) => <GuestWordRow key={word.id} word={word} color={categoryColor(word.category)} />)}</ul>}
      </Card>

      <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-500"><span>Page {page} of {pageCount}</span><div className="flex gap-2"><button type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="min-h-9 rounded-xl border border-slate-200 bg-white px-3 font-medium shadow-sm transition hover:bg-slate-50 disabled:opacity-40">Previous</button><button type="button" disabled={page >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} className="min-h-9 rounded-xl border border-slate-200 bg-white px-3 font-medium shadow-sm transition hover:bg-slate-50 disabled:opacity-40">Next</button></div></div>
    </div>
  );
}

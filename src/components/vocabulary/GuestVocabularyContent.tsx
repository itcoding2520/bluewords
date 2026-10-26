"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { useVocabulary } from "@/contexts/VocabularyContext";
import { CategoryDropdown } from "@/components/vocabulary/VocabularyToolbar";
import { PronunciationButton } from "@/components/vocabulary/PronunciationButton";

const PAGE_SIZE = 20;

export function GuestVocabularyContent() {
  const { words, categories, isLoaded } = useVocabulary();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);

  const filteredWords = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return words.filter((word) => {
      const matchesCategory = category === "All" || word.category === category;
      const matchesQuery = !query || `${word.word} ${word.meaning}`.toLocaleLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [category, search, words]);
  const pageCount = Math.max(1, Math.ceil(filteredWords.length / PAGE_SIZE));
  const pageWords = filteredWords.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <header className="mb-6">
        <p className="text-sm font-medium text-blue-600">Public vocabulary</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">Explore vocabulary</h1>
        <p className="mt-2 text-sm text-slate-500">Browse the starter vocabulary and words approved for everyone. Create an account to add and manage your own vocabulary.</p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search public vocabulary</span>
          <Search size={17} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search words or meanings…" className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
        </label>
        <CategoryDropdown category={category} categories={categories} words={words} onChange={(value) => { setCategory(value); setPage(1); }} includeAll allLabel="All categories" />
      </div>

      <Card className="mt-5 overflow-hidden p-0">
        <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 sm:px-6">{filteredWords.length} public words</div>
        {!isLoaded ? <p className="p-8 text-center text-sm text-slate-500">Loading vocabulary…</p> : pageWords.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">No public words match your search.</p> : (
          <ul className="divide-y divide-slate-100">
            {pageWords.map((word) => (
              <li key={word.id} className="flex items-start justify-between gap-3 px-4 py-4 sm:px-6">
                <div className="min-w-0">
                  <div className="flex items-center gap-1"><p className="font-semibold text-slate-900">{word.word}</p><PronunciationButton word={word.word} /></div>
                  <p className="mt-1 text-sm text-slate-600">{word.meaning}</p>
                  <span className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500">{word.category}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="mt-4 flex items-center justify-between gap-3 text-sm text-slate-500">
        <span>Page {page} of {pageCount}</span>
        <div className="flex gap-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 disabled:opacity-40">Previous</button>
          <button type="button" disabled={page >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  );
}

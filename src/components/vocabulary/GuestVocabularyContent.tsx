"use client";

import Link from "next/link";
import { Search, Sparkles, Star } from "lucide-react";

import { CategoryDropdown } from "@/components/vocabulary/VocabularyCategoryDropdown";
import { useGuestVocabularyController } from "@/hooks/useGuestVocabularyController";
import { GuestVocabularyTable } from "@/components/vocabulary/GuestVocabularyTable";
import { createPageNavigationActions } from "@/lib/pagination";

export function GuestVocabularyContent() {
  const {
    data: {
      words, categories, isLoaded, filteredWords, pageWords, categoryColor,
    },
    filters: { search, category, changeSearch, changeCategory },
    pagination: { page, pageCount, setPage },
  } = useGuestVocabularyController();
  const pageNavigation = createPageNavigationActions(pageCount, setPage);

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
          <input value={search} onChange={(event) => changeSearch(event.target.value)} placeholder="Search words or meanings…" className="h-11 w-full rounded-2xl border border-slate-200 bg-white/95 pl-10 pr-3 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
        </label>
        <CategoryDropdown category={category} categories={categories} words={words} onChange={changeCategory} includeAll allLabel="Select category" />
      </div>

      <GuestVocabularyTable
        isLoaded={isLoaded}
        pageWords={pageWords}
        filteredCount={filteredWords.length}
        page={page}
        pageCount={pageCount}
        categoryColor={categoryColor}
        onPrevious={pageNavigation.previousPage}
        onNext={pageNavigation.nextPage}
      />
    </div>
  );
}

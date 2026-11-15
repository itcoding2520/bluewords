"use client";

import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { useCommunityVocabularyController } from "@/hooks/useCommunityVocabularyController";
import { CommunityVocabularyWordList } from "@/components/vocabulary/CommunityVocabularyWordList";

export function CommunityVocabulary() {
  const { words, category, setCategory, search, setSearch, loaded, categories, visibleWords, fallbackWordImages } = useCommunityVocabularyController();

  if (loaded && words.length === 0) return null;

  return <section className="community-vocabulary-section mt-5 rounded-[1.75rem] border border-violet-100 bg-gradient-to-br from-violet-50/90 via-white to-indigo-50/80 p-5 shadow-[0_10px_28px_rgb(78_55_180/0.07)] sm:p-6">
    <div className="community-vocabulary-heading flex flex-wrap items-center justify-between gap-3"><div className="flex min-w-0 items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-violet-100"><Image src="/images/ui/icons/community.png" alt="" width={28} height={28} className="size-7 object-contain" /></span><div className="min-w-0"><h2 className="text-lg font-bold text-indigo-950">Community vocabulary</h2><p className="mt-0.5 text-sm text-slate-500">Approved custom words from other signed-in learners.</p></div></div><span className="community-vocabulary-count rounded-full border border-violet-100 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700">{words.length} words</span></div>
    <div className="community-vocabulary-controls mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"><div className="community-category-select"><select aria-label="Community category" value={category} onChange={(event) => setCategory(event.target.value)} className="community-category-select-input rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="all">All shared categories</option>{categories.map((name) => <option key={name} value={name}>{name}</option>)}</select><ChevronDown className="community-category-chevron" size={17} aria-hidden="true" /></div><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search shared words or meanings" aria-label="Search community vocabulary" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" /></div>
    <CommunityVocabularyWordList loaded={loaded} visibleWords={visibleWords} fallbackWordImages={fallbackWordImages} />
  </section>;
}

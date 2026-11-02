"use client";

import Image from "next/image";
import { ArrowLeft, BarChart3, BookOpen, CalendarDays, Check, Clock3, Grid3X3, Play, Tag, Trophy } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PronunciationButton } from "@/components/vocabulary/PronunciationButton";
import { useVocabularyImageUrl } from "@/hooks/useVocabularyImageUrl";
import { normalizeWordSearchWord } from "@/lib/word-search.mjs";
import type { VocabularyWord } from "@/data/vocabulary";
import type { WordSearchSessionRow } from "@/types/database";

function formatDuration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function HistoryWordCard({ word, meaning }: { word: VocabularyWord | undefined; meaning: string }) {
  const imageUrlFromPath = useVocabularyImageUrl(word?.imagePath);
  const imageUrl = word?.imageUrl ?? imageUrlFromPath;

  return (
    <li className="word-search-history-word-card">
      {imageUrl ? <Image src={imageUrl} alt={`Illustration for ${word?.word ?? "vocabulary word"}`} width={56} height={56} unoptimized className="word-search-history-word-image" /> : <span className="word-search-history-word-placeholder" aria-hidden="true">{word?.word.slice(0, 1).toUpperCase() ?? "?"}</span>}
      <span className="min-w-0 flex-1"><span className="flex items-center gap-1"><span className="truncate font-extrabold text-indigo-950">{word?.word ?? "Word no longer in your vocabulary"}</span>{word && <PronunciationButton word={word.word} />}</span><span className="mt-1 block truncate text-xs text-slate-500">{meaning}</span></span>
      <span className="word-search-history-word-check" aria-label="Found"><Check size={14} /></span>
    </li>
  );
}

export function WordSearchHistoryDetail({
  session,
  vocabularyByWord,
  onBack,
  onPlayAgain,
}: {
  session: WordSearchSessionRow;
  vocabularyByWord: Map<string, VocabularyWord>;
  onBack: () => void;
  onPlayAgain: () => void;
}) {
  return (
    <Card className="word-search-history-detail overflow-hidden p-0">
      <div className="word-search-history-detail-top">
        <button type="button" onClick={onBack} className="word-search-history-back inline-flex min-h-10 items-center gap-2 rounded-xl border border-blue-100 bg-white px-3 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50"><ArrowLeft size={16} /> All game attempts</button>
        <div className="word-search-history-detail-hero">
          <div className="word-search-history-detail-mascot"><Image src="/images/ui/illustrations/hero-book-mascot.svg" alt="" width={260} height={220} /></div>
          <div className="word-search-history-detail-summary">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-blue-600">Round complete</p>
            <h2 className="mt-2 flex flex-wrap items-center gap-2 text-3xl font-extrabold text-indigo-950 sm:text-5xl"><Trophy className="size-9 fill-amber-400 text-amber-500" /><span className="text-blue-600">{session.word_count}</span> words found</h2>
            <div className="word-search-history-detail-stats">
              <span className="word-search-history-detail-stat word-search-detail-time"><Clock3 /><span><small>Time</small><strong>{formatDuration(session.duration_seconds)}</strong></span></span>
              <span className="word-search-history-detail-stat word-search-detail-grid"><Grid3X3 /><span><small>Grid size</small><strong>{session.grid_size} × {session.grid_size}</strong></span></span>
              <span className="word-search-history-detail-stat word-search-detail-level"><BarChart3 /><span><small>Level</small><strong className="capitalize">{session.difficulty}</strong></span></span>
              <span className="word-search-history-detail-stat word-search-detail-category"><Tag /><span><small>Category</small><strong>{session.category === "all" ? "All categories" : session.category}</strong></span></span>
            </div>
            <p className="word-search-history-detail-date"><CalendarDays size={17} />{new Date(session.completed_at).toLocaleString()}</p>
          </div>
        </div>
      </div>
      <section className="word-search-history-words-section" aria-labelledby="word-search-history-words-title">
        <div className="word-search-history-words-heading"><h3 id="word-search-history-words-title"><BookOpen size={27} />Words from this round</h3><Button onClick={onPlayAgain} className="rounded-full px-5"><Play size={16} fill="currentColor" /> Play again</Button></div>
        <ul className="word-search-history-word-grid">{session.words.map((word) => {
          const vocabularyWord = vocabularyByWord.get(normalizeWordSearchWord(word));
          const meaning = vocabularyWord?.meaning?.trim() || vocabularyWord?.detailedMeanings?.find((item) => item.meaning.trim())?.meaning || "Meaning unavailable";
          return <HistoryWordCard key={word} word={vocabularyWord} meaning={meaning} />;
        })}</ul>
      </section>
    </Card>
  );
}

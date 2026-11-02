import Image from "next/image";
import { ArrowRight, Award, CalendarDays, Clock3, Gamepad2, RotateCcw, Star, Trophy, ChevronLeft, ChevronRight } from "lucide-react";

import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { Button } from "@/components/ui/Button";
import type { WordSearchSessionRow } from "@/types/database";

function formatDuration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function WordSearchHistoryList({
  history,
  historyTotal,
  historyPage,
  historyLoading,
  historyError,
  fastestSeconds,
  averageWordsPerRound,
  onRefresh,
  onPlay,
  onSelect,
  onPageChange,
}: {
  history: WordSearchSessionRow[];
  historyTotal: number;
  historyPage: number;
  historyLoading: boolean;
  historyError: string;
  fastestSeconds: number | null;
  averageWordsPerRound: number;
  onRefresh: () => void;
  onPlay: () => void;
  onSelect: (session: WordSearchSessionRow) => void;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(historyTotal / 10));

  return (
    <>
      <div className="word-search-history-welcome">
        <div><p className="text-xs font-bold uppercase tracking-[.14em] text-blue-600">Your progress</p><h2 className="mt-1 text-3xl font-extrabold text-indigo-950 sm:text-4xl">Your game <span className="text-blue-600">journey</span><Star className="ml-2 inline size-6 fill-amber-400 text-amber-400" /></h2><p className="mt-2 max-w-lg text-sm leading-6 text-slate-600 sm:text-base">Great job exploring new words! Keep playing to build your vocabulary and beat your best time.</p></div>
        <Image src="/images/ui/illustrations/review-trophy.svg" alt="" width={250} height={180} className="word-search-history-mascot" />
      </div>

      <div className="word-search-history-stats">
        <div className="word-search-history-stat word-search-history-stat-games"><span className="word-search-history-stat-icon"><Gamepad2 size={30} /></span><span><span className="block text-sm font-bold text-blue-700">Total games</span><strong>{historyTotal}</strong></span></div>
        <div className="word-search-history-stat word-search-history-stat-time"><span className="word-search-history-stat-icon"><Clock3 size={30} /></span><span><span className="block text-sm font-bold text-emerald-700">Best time on page</span><strong>{fastestSeconds === null ? "—" : formatDuration(fastestSeconds)}</strong></span></div>
        <div className="word-search-history-stat word-search-history-stat-words"><span className="word-search-history-stat-icon"><Star size={30} /></span><span><span className="block text-sm font-bold text-violet-700">Avg. words per round</span><strong>{history.length ? averageWordsPerRound : "—"}</strong></span></div>
      </div>

      <section className="word-search-history-list" aria-labelledby="word-search-history-title">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h3 id="word-search-history-title" className="text-xl font-extrabold text-indigo-950">Your Word Search history</h3><p className="mt-1 text-sm text-slate-500">Grouped by category, fastest time first.</p></div><Button variant="secondary" onClick={onRefresh} disabled={historyLoading} className="rounded-full border-blue-100 bg-white px-5 text-blue-600"><RotateCcw size={15} className={historyLoading ? "animate-spin" : ""} /> Refresh</Button></div>
        {historyError && <AutoDismissMessage key={historyError} variant="error" className="mb-4">{historyError}</AutoDismissMessage>}
        {historyLoading ? <p role="status" className="py-10 text-center text-sm text-slate-500">Loading your game history…</p> : history.length === 0 ? <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 px-5 py-10 text-center"><Trophy className="mx-auto size-9 text-blue-400" /><p className="mt-3 font-bold text-indigo-950">Your journey starts here</p><p className="mt-1 text-sm text-slate-500">Finish a Word Search round and it will appear here.</p><Button className="mt-4" onClick={onPlay}><Gamepad2 size={16} /> Play a round</Button></div> : <div className="space-y-3">{history.map((session, index) => <button key={session.id} type="button" onClick={() => onSelect(session)} className={`word-search-history-entry word-search-history-entry-${index % 3} group flex w-full flex-wrap items-center gap-4 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md sm:p-5`}><span className="word-search-history-medal" aria-hidden="true"><Award size={35} /></span><span className="min-w-0 flex-1"><span className="block text-base font-extrabold text-indigo-950 sm:text-lg">{session.word_count} words · {session.grid_size} × {session.grid_size} · {session.difficulty}</span><span className="mt-2 flex flex-wrap gap-1.5"><span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">{session.grid_size} × {session.grid_size}</span><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold capitalize text-emerald-700">{session.difficulty}</span><span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-bold text-violet-700">{session.category === "all" ? "All categories" : session.category}</span><span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">{session.word_count} words</span></span><span className="mt-2 flex items-center gap-1.5 text-xs text-slate-500"><CalendarDays size={14} />{new Date(session.completed_at).toLocaleString()}</span></span><span className="flex items-center gap-3 text-sm font-bold tabular-nums text-slate-600"><Clock3 size={16} />{formatDuration(session.duration_seconds)}<ArrowRight size={17} className="text-blue-500 transition group-hover:translate-x-1" /></span></button>)}</div>}
        {!historyLoading && !historyError && historyTotal > 0 && <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm text-slate-500"><span>Page {historyPage} of {totalPages}</span><div className="flex gap-2"><Button variant="secondary" aria-label="Previous history page" disabled={historyPage <= 1} onClick={() => onPageChange(historyPage - 1)}><ChevronLeft size={16} /></Button><Button variant="secondary" aria-label="Next history page" disabled={historyPage >= totalPages} onClick={() => onPageChange(historyPage + 1)}><ChevronRight size={16} /></Button></div></div>}
      </section>
    </>
  );
}

import Image from "next/image";
import { Gamepad2, RotateCcw, Star, Trophy } from "lucide-react";

import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { Button } from "@/components/ui/Button";
import type { WordSearchSessionRow } from "@/types/database";
import { getPageCount } from "@/lib/pagination";
import { WordSearchHistoryStats } from "@/components/games/WordSearchHistoryStats";
import { WordSearchHistorySessionButton } from "@/components/games/WordSearchHistorySessionButton";
import { WordSearchHistoryPagination } from "@/components/games/WordSearchHistoryPagination";


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
  const totalPages = getPageCount(historyTotal, 10);

  return (
    <>
      <div className="word-search-history-welcome">
        <div><p className="text-xs font-bold uppercase tracking-[.14em] text-blue-600">Your progress</p><h2 className="mt-1 text-3xl font-extrabold text-indigo-950 sm:text-4xl">Your game <span className="text-blue-600">journey</span><Star className="ml-2 inline size-6 fill-amber-400 text-amber-400" /></h2><p className="mt-2 max-w-lg text-sm leading-6 text-slate-600 sm:text-base">Great job exploring new words! Keep playing to build your vocabulary and beat your best time.</p></div>
        <Image src="/images/ui/illustrations/review-trophy.svg" alt="" width={250} height={180} className="word-search-history-mascot" />
      </div>

      <WordSearchHistoryStats
        historyTotal={historyTotal}
        fastestSeconds={fastestSeconds}
        averageWordsPerRound={averageWordsPerRound}
        hasHistory={history.length > 0}
      />

      <section className="word-search-history-list" aria-labelledby="word-search-history-title">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h3 id="word-search-history-title" className="text-xl font-extrabold text-indigo-950">Your Word Search history</h3><p className="mt-1 text-sm text-slate-500">Grouped by category, fastest time first.</p></div><Button variant="secondary" onClick={onRefresh} disabled={historyLoading} className="rounded-full border-blue-100 bg-white px-5 text-blue-600"><RotateCcw size={15} className={historyLoading ? "animate-spin" : ""} /> Refresh</Button></div>
        {historyError && <AutoDismissMessage key={historyError} variant="error" className="mb-4">{historyError}</AutoDismissMessage>}
        {historyLoading ? (
          <p role="status" className="py-10 text-center text-sm text-slate-500">Loading your game history…</p>
        ) : history.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 px-5 py-10 text-center">
            <Trophy className="mx-auto size-9 text-blue-400" />
            <p className="mt-3 font-bold text-indigo-950">Your journey starts here</p>
            <p className="mt-1 text-sm text-slate-500">Finish a Word Search round and it will appear here.</p>
            <Button className="mt-4" onClick={onPlay}><Gamepad2 size={16} /> Play a round</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((session, index) => (
              <WordSearchHistorySessionButton
                key={session.id}
                session={session}
                index={index}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
        {historyTotal > 0 && (
          <WordSearchHistoryPagination
            historyPage={historyPage}
            totalPages={totalPages}
            historyLoading={historyLoading}
            historyError={historyError}
            onPageChange={onPageChange}
          />
        )}
      </section>
    </>
  );
}

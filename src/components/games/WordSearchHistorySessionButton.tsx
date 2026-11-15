import { ArrowRight, Award, CalendarDays, Clock3 } from "lucide-react";
import type { WordSearchSessionRow } from "@/types/database";
import { formatGameDuration } from "@/lib/game-duration";
import { formatDateTime } from "@/lib/formatDate";

export function WordSearchHistorySessionButton({
  session,
  index,
  onSelect,
}: {
  session: WordSearchSessionRow;
  index: number;
  onSelect: (session: WordSearchSessionRow) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(session)}
      className={`word-search-history-entry word-search-history-entry-${index % 3} group flex w-full flex-wrap items-center gap-4 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md sm:p-5`}
    >
      <span className="word-search-history-medal" aria-hidden="true"><Award size={35} /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-extrabold text-indigo-950 sm:text-lg">
          {session.word_count} words · {session.grid_size} × {session.grid_size} · {session.difficulty}
        </span>
        <span className="mt-2 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">{session.grid_size} × {session.grid_size}</span>
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold capitalize text-emerald-700">{session.difficulty}</span>
          <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-bold text-violet-700">{session.category === "all" ? "All categories" : session.category}</span>
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">{session.word_count} words</span>
        </span>
        <span className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
          <CalendarDays size={14} />{formatDateTime(session.completed_at)}
        </span>
      </span>
      <span className="flex items-center gap-3 text-sm font-bold tabular-nums text-slate-600">
        <Clock3 size={16} />{formatGameDuration(session.duration_seconds)}
        <ArrowRight size={17} className="text-blue-500 transition group-hover:translate-x-1" />
      </span>
    </button>
  );
}

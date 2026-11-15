import { Clock3, Gamepad2, Star } from "lucide-react";
import { formatGameDuration } from "@/lib/game-duration";

export function WordSearchHistoryStats({
  historyTotal,
  fastestSeconds,
  averageWordsPerRound,
  hasHistory,
}: {
  historyTotal: number;
  fastestSeconds: number | null;
  averageWordsPerRound: number;
  hasHistory: boolean;
}) {
  return (
    <div className="word-search-history-stats">
      <div className="word-search-history-stat word-search-history-stat-games">
        <span className="word-search-history-stat-icon"><Gamepad2 size={30} /></span>
        <span>
          <span className="block text-sm font-bold text-blue-700">Total games</span>
          <strong>{historyTotal}</strong>
        </span>
      </div>
      <div className="word-search-history-stat word-search-history-stat-time">
        <span className="word-search-history-stat-icon"><Clock3 size={30} /></span>
        <span>
          <span className="block text-sm font-bold text-emerald-700">Best time on page</span>
          <strong>{fastestSeconds === null ? "—" : formatGameDuration(fastestSeconds)}</strong>
        </span>
      </div>
      <div className="word-search-history-stat word-search-history-stat-words">
        <span className="word-search-history-stat-icon"><Star size={30} /></span>
        <span>
          <span className="block text-sm font-bold text-violet-700">Avg. words per round</span>
          <strong>{hasHistory ? averageWordsPerRound : "—"}</strong>
        </span>
      </div>
    </div>
  );
}

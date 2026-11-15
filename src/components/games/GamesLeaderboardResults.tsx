import { Clock3, Crown } from "lucide-react";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { UserAvatar } from "@/components/user/UserAvatar";
import type { LeaderboardGame, LeaderboardRow } from "@/hooks/useGamesLeaderboardController";
import { formatClockDuration } from "@/lib/clock-duration";

export function GamesLeaderboardResults({
  game,
  rows,
  loading,
  error,
}: {
  game: LeaderboardGame;
  rows: LeaderboardRow[];
  loading: boolean;
  error: string;
}) {
  if (error) return <AutoDismissMessage key={error} variant="error">{error}</AutoDismissMessage>;
  if (loading) return <div className="py-10 text-center text-sm text-slate-500" role="status">Loading leaderboard…</div>;
  if (rows.length === 0) return <div className="rounded-xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">No completed games yet. Be the first on the board!</div>;

  return (
    <ol className="space-y-2" aria-label={`${game} rankings`}>
      {rows.map((row) => {
        const resultLabel = "correct_count" in row
          ? "question_count" in row
            ? `${row.correct_count}/${row.question_count} correct`
            : `${row.score} points`
          : `${row.word_count} words · ${row.category}`;

        return (
          <li key={`${row.rank_position}-${row.player_name}`} className={`games-rank-${row.rank_position} flex min-h-16 items-center gap-3 rounded-xl border px-3 py-3 sm:px-4 ${row.is_you ? "border-blue-200 bg-blue-50/70" : "border-slate-100"}`}>
            <span className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold ${row.rank_position === 1 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{row.rank_position}</span>
            <UserAvatar nickname={row.player_name} fallbackName={row.player_name} avatarPath={row.avatar_path} sizeClassName="size-10 text-xs" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-slate-900">{row.is_you ? "You" : row.player_name}{row.rank_position === 1 ? " 🏆" : ""}</span>
              <span className="mt-0.5 block text-xs text-slate-500">{resultLabel}</span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold tabular-nums text-slate-700"><Clock3 size={15} className="text-slate-400" />{formatClockDuration(row.duration_seconds)}</span>
            {row.rank_position <= 3 && <Crown size={27} className="games-rank-crown" aria-label={`Rank ${row.rank_position}`} />}
          </li>
        );
      })}
    </ol>
  );
}

"use client";

import { ChevronDown, Clock3, Crown, RefreshCw, Trophy } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { UserAvatar } from "@/components/user/UserAvatar";
import { useGamesLeaderboardController } from "@/hooks/useGamesLeaderboardController";
import { formatClockDuration } from "@/lib/clock-duration";
import { GamesLeaderboardControls } from "@/components/games/GamesLeaderboardControls";

export function GamesLeaderboard() {
  const {
    game, quizMode, questionCount, gridSize, difficulty, rows,
    loading, refreshing, error, expanded, setExpanded,
    refresh, selectGame, selectQuizMode, selectQuestionCount,
    selectGridSize, selectDifficulty,
  } = useGamesLeaderboardController();

  return (
    <section className="games-leaderboard" aria-labelledby="game-leaderboard-title">
      <Card className="overflow-hidden p-0">
        <div className="games-leaderboard-compact-head">
          <button type="button" aria-expanded={expanded} aria-controls="games-leaderboard-content" onClick={() => setExpanded((value) => !value)}>
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-yellow-100 text-amber-500"><Trophy size={20} /></span>
            <span><strong>Game leaderboard</strong><small>See top players and your rank</small></span>
            <ChevronDown size={19} className={expanded ? "is-expanded" : ""} />
          </button>
          <button type="button" onClick={refresh} disabled={loading} aria-label="Refresh leaderboard" className="games-leaderboard-compact-refresh"><RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /></button>
        </div>
        <div className="games-leaderboard-desktop-head flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-yellow-100 text-amber-500"><Trophy size={21} /></span>
            <div>
              <h2 id="game-leaderboard-title" className="text-lg font-semibold text-slate-950">Game leaderboard</h2>
              <p className="mt-1 text-sm text-slate-500">Best result per player · top 50 plus your rank · anonymous names</p>
            </div>
          </div>
          <button type="button" onClick={refresh} disabled={loading} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:border-blue-200 hover:text-blue-700 disabled:opacity-50">
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        <div id="games-leaderboard-content" className={`games-leaderboard-content space-y-4 p-5 sm:p-6 ${expanded ? "is-expanded" : ""}`}>
          <GamesLeaderboardControls
            game={game}
            quizMode={quizMode}
            questionCount={questionCount}
            gridSize={gridSize}
            difficulty={difficulty}
            onGameChange={selectGame}
            onQuizModeChange={selectQuizMode}
            onQuestionCountChange={selectQuestionCount}
            onGridSizeChange={selectGridSize}
            onDifficultyChange={selectDifficulty}
          />

          {error ? <AutoDismissMessage key={error} variant="error">{error}</AutoDismissMessage>
            : loading ? <div className="py-10 text-center text-sm text-slate-500" role="status">Loading leaderboard…</div>
              : rows.length === 0 ? <div className="rounded-xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">No completed games yet. Be the first on the board!</div>
                : <ol className="space-y-2" aria-label={`${game} rankings`}>
                  {rows.map((row) => {
                    const resultLabel = "correct_count" in row
                      ? "question_count" in row
                        ? `${row.correct_count}/${row.question_count} correct`
                        : `${row.score} points`
                      : `${row.word_count} words · ${row.category}`;
                    return <li key={`${row.rank_position}-${row.player_name}`} className={`games-rank-${row.rank_position} flex min-h-16 items-center gap-3 rounded-xl border px-3 py-3 sm:px-4 ${row.is_you ? "border-blue-200 bg-blue-50/70" : "border-slate-100"}`}>
                      <span className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold ${row.rank_position === 1 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{row.rank_position}</span>
                      <UserAvatar nickname={row.player_name} fallbackName={row.player_name} avatarPath={row.avatar_path} sizeClassName="size-10 text-xs" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-900">{row.is_you ? "You" : row.player_name}{row.rank_position === 1 ? " 🏆" : ""}</span>
                        <span className="mt-0.5 block text-xs text-slate-500">{resultLabel}</span>
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold tabular-nums text-slate-700"><Clock3 size={15} className="text-slate-400" />{formatClockDuration(row.duration_seconds)}</span>
                      {row.rank_position <= 3 && <Crown size={27} className="games-rank-crown" aria-label={`Rank ${row.rank_position}`} />}
                    </li>;
                  })}
                </ol>}
        </div>
      </Card>
    </section>
  );
}

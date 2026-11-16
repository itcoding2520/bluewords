"use client";

import { ChevronDown, RefreshCw, Trophy } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { useGamesLeaderboardController } from "@/hooks/useGamesLeaderboardController";
import { GamesLeaderboardControls } from "@/components/games/GamesLeaderboardControls";
import { GamesLeaderboardResults } from "@/components/games/GamesLeaderboardResults";

export function GamesLeaderboard() {
  const {
    filters: {
      game, quizMode, questionCount, gridSize, difficulty, selectGame,
      selectQuizMode, selectQuestionCount, selectGridSize, selectDifficulty,
    },
    results: { rows, loading, error },
    display: { refreshing, expanded, setExpanded },
    actions: { refresh },
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

          <GamesLeaderboardResults game={game} rows={rows} loading={loading} error={error} />
        </div>
      </Card>
    </section>
  );
}

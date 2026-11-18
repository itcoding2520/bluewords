import { useState } from "react";
import type {
  LeaderboardFilters,
  LeaderboardDifficulty,
  LeaderboardGame,
  LeaderboardGridSize,
  LeaderboardQuestionCount,
  LeaderboardQuizMode,
} from "@/lib/games/leaderboard-filters";
import { useGamesLeaderboardData } from "@/hooks/useGamesLeaderboardData";

export type {
  LeaderboardDifficulty,
  LeaderboardGame,
  LeaderboardGridSize,
  LeaderboardQuestionCount,
  LeaderboardQuizMode,
} from "@/lib/games/leaderboard-filters";
export type { GamesLeaderboardRow as LeaderboardRow } from "@/hooks/useGamesLeaderboardData";

export function useGamesLeaderboardController() {
  const [filters, setFilters] = useState<LeaderboardFilters>({
    game: "quiz",
    quizMode: "choose-meaning",
    questionCount: 10,
    gridSize: 10,
    difficulty: "easy",
  });
  const [expanded, setExpanded] = useState(false);
  const data = useGamesLeaderboardData(filters);

  function updateFilters(patch: Partial<LeaderboardFilters>) {
    data.prepareFilterChange();
    setFilters((current) => ({ ...current, ...patch }));
  }

  function selectGame(nextGame: LeaderboardGame) {
    if (filters.game === nextGame) return;
    updateFilters({ game: nextGame });
  }

  function selectQuizMode(nextMode: LeaderboardQuizMode) {
    updateFilters({ quizMode: nextMode });
  }

  function selectQuestionCount(nextCount: LeaderboardQuestionCount) {
    updateFilters({ questionCount: nextCount });
  }

  function selectGridSize(nextGridSize: LeaderboardGridSize) {
    updateFilters({ gridSize: nextGridSize });
  }

  function selectDifficulty(nextDifficulty: LeaderboardDifficulty) {
    updateFilters({ difficulty: nextDifficulty });
  }

  return {
    filters: {
      ...filters,
      selectGame,
      selectQuizMode,
      selectQuestionCount,
      selectGridSize,
      selectDifficulty,
    },
    results: { rows: data.rows, loading: data.loading, error: data.error },
    display: { refreshing: data.refreshing, expanded, setExpanded },
    actions: { refresh: data.refresh },
  };
}

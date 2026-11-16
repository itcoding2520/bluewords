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

  function selectGame(nextGame: LeaderboardGame) {
    if (filters.game === nextGame) return;
    data.prepareFilterChange();
    setFilters((current) => ({ ...current, game: nextGame }));
  }

  function selectQuizMode(nextMode: LeaderboardQuizMode) {
    data.prepareFilterChange();
    setFilters((current) => ({ ...current, quizMode: nextMode }));
  }

  function selectQuestionCount(nextCount: LeaderboardQuestionCount) {
    data.prepareFilterChange();
    setFilters((current) => ({ ...current, questionCount: nextCount }));
  }

  function selectGridSize(nextGridSize: LeaderboardGridSize) {
    data.prepareFilterChange();
    setFilters((current) => ({ ...current, gridSize: nextGridSize }));
  }

  function selectDifficulty(nextDifficulty: LeaderboardDifficulty) {
    data.prepareFilterChange();
    setFilters((current) => ({ ...current, difficulty: nextDifficulty }));
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

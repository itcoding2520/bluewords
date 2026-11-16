import { useEffect, useState } from "react";
import type {
  LeaderboardDifficulty,
  LeaderboardGame,
  LeaderboardGridSize,
  LeaderboardQuestionCount,
  LeaderboardQuizMode,
} from "@/lib/games/leaderboard-filters";
import {
  getQuizLeaderboard,
  getVocabularyGameLeaderboard,
  getWordSearchLeaderboard,
  type QuizLeaderboardRow,
  type VocabularyGameLeaderboardRow,
  type WordSearchLeaderboardRow,
} from "@/lib/supabase/game-leaderboard";

export type {
  LeaderboardDifficulty,
  LeaderboardGame,
  LeaderboardGridSize,
  LeaderboardQuestionCount,
  LeaderboardQuizMode,
} from "@/lib/games/leaderboard-filters";
export type LeaderboardRow = QuizLeaderboardRow | WordSearchLeaderboardRow | VocabularyGameLeaderboardRow;

interface LeaderboardFilters {
  game: LeaderboardGame;
  quizMode: LeaderboardQuizMode;
  questionCount: LeaderboardQuestionCount;
  gridSize: LeaderboardGridSize;
  difficulty: LeaderboardDifficulty;
}

export function useGamesLeaderboardController() {
  const [filters, setFilters] = useState<LeaderboardFilters>({
    game: "quiz",
    quizMode: "choose-meaning",
    questionCount: 10,
    gridSize: 10,
    difficulty: "easy",
  });
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let active = true;

    const request = filters.game === "quiz"
      ? getQuizLeaderboard({ mode: filters.quizMode, questionCount: filters.questionCount })
      : filters.game === "word-search"
        ? getWordSearchLeaderboard({ gridSize: filters.gridSize, difficulty: filters.difficulty })
        : getVocabularyGameLeaderboard({ gameType: filters.game, roundSize: null });

    void request.then((result) => {
      if (active) setRows(result);
    }).catch(() => {
      if (active) {
        setRows([]);
        setError("Could not load the leaderboard. Please try again.");
      }
    }).finally(() => {
      if (active) {
        setLoading(false);
        setRefreshing(false);
      }
    });

    return () => { active = false; };
  }, [filters, reloadKey]);

  function refresh() {
    setLoading(true);
    setError("");
    setRefreshing(true);
    setReloadKey((key) => key + 1);
  }

  function prepareFilterChange() {
    setLoading(true);
    setError("");
  }

  function selectGame(nextGame: LeaderboardGame) {
    if (filters.game === nextGame) return;
    prepareFilterChange();
    setFilters((current) => ({ ...current, game: nextGame }));
  }

  function selectQuizMode(nextMode: LeaderboardQuizMode) {
    prepareFilterChange();
    setFilters((current) => ({ ...current, quizMode: nextMode }));
  }

  function selectQuestionCount(nextCount: LeaderboardQuestionCount) {
    prepareFilterChange();
    setFilters((current) => ({ ...current, questionCount: nextCount }));
  }

  function selectGridSize(nextGridSize: LeaderboardGridSize) {
    prepareFilterChange();
    setFilters((current) => ({ ...current, gridSize: nextGridSize }));
  }

  function selectDifficulty(nextDifficulty: LeaderboardDifficulty) {
    prepareFilterChange();
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
    results: { rows, loading, error },
    display: { refreshing, expanded, setExpanded },
    actions: { refresh },
  };
}

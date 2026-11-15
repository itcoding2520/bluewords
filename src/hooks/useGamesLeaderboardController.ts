import { useEffect, useState } from "react";
import {
  getQuizLeaderboard,
  getVocabularyGameLeaderboard,
  getWordSearchLeaderboard,
  type QuizLeaderboardRow,
  type VocabularyGameLeaderboardRow,
  type WordSearchLeaderboardRow,
} from "@/lib/supabase/game-leaderboard";

export type LeaderboardGame = "quiz" | "word-search" | "word-match" | "word-scramble" | "word-maze" | "sentence-builder";
export type LeaderboardQuizMode = "choose-meaning" | "type-word";
export type LeaderboardDifficulty = "easy" | "medium" | "hard";
export type LeaderboardQuestionCount = 10 | 20 | 30;
export type LeaderboardGridSize = 10 | 15 | 20;
export type LeaderboardRow = QuizLeaderboardRow | WordSearchLeaderboardRow | VocabularyGameLeaderboardRow;

export function useGamesLeaderboardController() {
  const [game, setGame] = useState<LeaderboardGame>("quiz");
  const [quizMode, setQuizMode] = useState<LeaderboardQuizMode>("choose-meaning");
  const [questionCount, setQuestionCount] = useState<LeaderboardQuestionCount>(10);
  const [gridSize, setGridSize] = useState<LeaderboardGridSize>(10);
  const [difficulty, setDifficulty] = useState<LeaderboardDifficulty>("easy");
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let active = true;

    const request = game === "quiz"
      ? getQuizLeaderboard({ mode: quizMode, questionCount })
      : game === "word-search"
        ? getWordSearchLeaderboard({ gridSize, difficulty })
        : getVocabularyGameLeaderboard({ gameType: game, roundSize: null });

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
  }, [game, quizMode, questionCount, gridSize, difficulty, reloadKey]);

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
    if (game === nextGame) return;
    prepareFilterChange();
    setGame(nextGame);
  }

  function selectQuizMode(nextMode: LeaderboardQuizMode) {
    prepareFilterChange();
    setQuizMode(nextMode);
  }

  function selectQuestionCount(nextCount: LeaderboardQuestionCount) {
    prepareFilterChange();
    setQuestionCount(nextCount);
  }

  function selectGridSize(nextGridSize: LeaderboardGridSize) {
    prepareFilterChange();
    setGridSize(nextGridSize);
  }

  function selectDifficulty(nextDifficulty: LeaderboardDifficulty) {
    prepareFilterChange();
    setDifficulty(nextDifficulty);
  }

  return {
    filters: {
      game,
      quizMode,
      questionCount,
      gridSize,
      difficulty,
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

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
type QuizMode = "choose-meaning" | "type-word";
type Difficulty = "easy" | "medium" | "hard";
type LeaderboardRow = QuizLeaderboardRow | WordSearchLeaderboardRow | VocabularyGameLeaderboardRow;

export function useGamesLeaderboardController() {
  const [game, setGame] = useState<LeaderboardGame>("quiz");
  const [quizMode, setQuizMode] = useState<QuizMode>("choose-meaning");
  const [questionCount, setQuestionCount] = useState<10 | 20 | 30>(10);
  const [gridSize, setGridSize] = useState<10 | 15 | 20>(10);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
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

  function selectGame(nextGame: LeaderboardGame) {
    if (game === nextGame) return;
    setLoading(true);
    setError("");
    setGame(nextGame);
  }

  function selectQuizMode(nextMode: QuizMode) {
    setLoading(true);
    setError("");
    setQuizMode(nextMode);
  }

  function selectQuestionCount(nextCount: 10 | 20 | 30) {
    setLoading(true);
    setError("");
    setQuestionCount(nextCount);
  }

  function selectGridSize(nextGridSize: 10 | 15 | 20) {
    setLoading(true);
    setError("");
    setGridSize(nextGridSize);
  }

  function selectDifficulty(nextDifficulty: Difficulty) {
    setLoading(true);
    setError("");
    setDifficulty(nextDifficulty);
  }

  return {
    game, quizMode, questionCount, gridSize, difficulty, rows,
    loading, refreshing, error, expanded, setExpanded,
    refresh, selectGame, selectQuizMode, selectQuestionCount,
    selectGridSize, selectDifficulty,
  };
}

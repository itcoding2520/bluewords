import type { LeaderboardFilters } from "@/lib/games/leaderboard-filters";
import {
  getQuizLeaderboard,
  getVocabularyGameLeaderboard,
  getWordSearchLeaderboard,
} from "@/lib/supabase/game-leaderboard";

export function loadGamesLeaderboard(filters: LeaderboardFilters) {
  switch (filters.game) {
    case "quiz":
      return getQuizLeaderboard({ mode: filters.quizMode, questionCount: filters.questionCount });
    case "word-search":
      return getWordSearchLeaderboard({ gridSize: filters.gridSize, difficulty: filters.difficulty });
    default:
      return getVocabularyGameLeaderboard({ gameType: filters.game, roundSize: null });
  }
}

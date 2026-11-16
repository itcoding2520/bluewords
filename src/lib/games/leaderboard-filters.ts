import { DIFFICULTY_LEVELS, type DifficultyLevel } from "@/types/difficulty";
import type { VocabularyGameType } from "@/types/game";
import type { QuizMode } from "@/types/quiz";

export const LEADERBOARD_QUIZ_MODES = ["choose-meaning", "type-word"] as const satisfies readonly QuizMode[];
export const LEADERBOARD_QUESTION_COUNTS = [10, 20, 30] as const;
export const LEADERBOARD_GRID_SIZES = [10, 15, 20] as const;

export type LeaderboardGame = "quiz" | "word-search" | VocabularyGameType;
export type LeaderboardQuizMode = (typeof LEADERBOARD_QUIZ_MODES)[number];
export type LeaderboardDifficulty = DifficultyLevel;
export type LeaderboardQuestionCount = (typeof LEADERBOARD_QUESTION_COUNTS)[number];
export type LeaderboardGridSize = (typeof LEADERBOARD_GRID_SIZES)[number];

export const LEADERBOARD_DIFFICULTIES = DIFFICULTY_LEVELS;

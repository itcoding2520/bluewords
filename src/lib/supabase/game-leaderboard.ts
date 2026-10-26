import { createClient } from "@/lib/supabase/client";

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  supabase ??= createClient();
  return supabase;
}

export type QuizLeaderboardRow = {
  rank_position: number;
  player_name: string;
  avatar_path: string | null;
  correct_count: number;
  question_count: number;
  duration_seconds: number;
  is_you: boolean;
};

export type WordSearchLeaderboardRow = {
  rank_position: number;
  player_name: string;
  avatar_path: string | null;
  category: string;
  word_count: number;
  duration_seconds: number;
  is_you: boolean;
};

export type VocabularyGameLeaderboardRow = {
  rank_position: number;
  player_name: string;
  avatar_path: string | null;
  game_type: "word-match" | "word-scramble" | "word-maze";
  round_size: number;
  score: number;
  correct_count: number;
  moves: number;
  duration_seconds: number;
  is_you: boolean;
};

export async function saveVocabularyGameSession(input: {
  gameType: "word-match" | "word-scramble" | "word-maze";
  roundSize: number;
  score: number;
  correctCount: number;
  moves: number;
  durationSeconds: number;
  startedAt: string;
  completedAt: string;
}): Promise<void> {
  const { data: { user }, error: authError } = await getSupabase().auth.getUser();
  if (authError || !user) throw new Error("You must be logged in to save game results.");

  const { error } = await getSupabase().rpc("save_vocabulary_game_session", {
    p_game_type: input.gameType,
    p_round_size: input.roundSize,
    p_score: input.score,
    p_correct_count: input.correctCount,
    p_moves: input.moves,
    p_duration_seconds: input.durationSeconds,
    p_started_at: input.startedAt,
    p_completed_at: input.completedAt,
  });
  if (error) throw error;
}

export async function getVocabularyGameLeaderboard(input: {
  gameType: "word-match" | "word-scramble" | "word-maze";
  roundSize: number | null;
}): Promise<VocabularyGameLeaderboardRow[]> {
  const { data, error } = await getSupabase().rpc("get_vocabulary_game_leaderboard", {
    p_game_type: input.gameType,
    p_round_size: input.roundSize,
    p_limit: 50,
  });
  if (error) throw error;
  return (data ?? []) as VocabularyGameLeaderboardRow[];
}

export async function getQuizLeaderboard(input: {
  mode: "type-word" | "choose-meaning";
  questionCount: 10 | 20 | 30;
}): Promise<QuizLeaderboardRow[]> {
  const { data, error } = await getSupabase().rpc("get_vocabulary_quiz_leaderboard", {
    p_mode: input.mode,
    p_question_count: input.questionCount,
    p_limit: 50,
  });
  if (error) throw error;
  return (data ?? []) as QuizLeaderboardRow[];
}

export async function getWordSearchLeaderboard(input: {
  gridSize: 10 | 15 | 20;
  difficulty: "easy" | "medium" | "hard";
}): Promise<WordSearchLeaderboardRow[]> {
  const { data, error } = await getSupabase().rpc("get_word_search_leaderboard", {
    p_grid_size: input.gridSize,
    p_difficulty: input.difficulty,
    p_category: null,
    p_limit: 50,
  });
  if (error) throw error;
  return (data ?? []) as WordSearchLeaderboardRow[];
}

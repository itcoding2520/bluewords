import { createClient } from "@/lib/supabase/client";

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  supabase ??= createClient();
  return supabase;
}

export type QuizLeaderboardRow = {
  rank_position: number;
  player_name: string;
  correct_count: number;
  question_count: number;
  duration_seconds: number;
  is_you: boolean;
};

export type WordSearchLeaderboardRow = {
  rank_position: number;
  player_name: string;
  category: string;
  word_count: number;
  duration_seconds: number;
  is_you: boolean;
};

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

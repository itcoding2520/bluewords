import { createClient } from "@/lib/supabase/client";
import type { WordSearchDifficulty, WordSearchSessionRow } from "@/types/database";
import {
  getCachedWordSearchHistory,
  invalidateWordSearchHistoryCache,
  setCachedWordSearchHistory,
} from "@/lib/supabase/word-search-history-cache.mjs";

const supabase = createClient();

export function getCachedWordSearchSessions(userId: string, page = 1, pageSize = 10) {
  return getCachedWordSearchHistory(userId, page, pageSize) as { rows: WordSearchSessionRow[]; total: number } | null;
}

export async function saveWordSearchSession(input: {
  gridSize: 10 | 15 | 20;
  difficulty: WordSearchDifficulty;
  category: string;
  words: string[];
  durationSeconds: number;
  startedAt: string;
  completedAt: string;
}): Promise<void> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("You must be logged in to save game history.");

  const { error } = await supabase.rpc("save_word_search_session", {
    p_grid_size: input.gridSize,
    p_difficulty: input.difficulty,
    p_category: input.category,
    p_word_count: input.words.length,
    p_duration_seconds: input.durationSeconds,
    p_words: input.words,
    p_started_at: input.startedAt,
    p_completed_at: input.completedAt,
  });
  if (error) throw error;
  invalidateWordSearchHistoryCache(user.id);
}

export async function getWordSearchSessions(input: {
  page: number;
  pageSize: number;
  forceRefresh?: boolean;
}): Promise<{ rows: WordSearchSessionRow[]; total: number }> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("You must be logged in to view game history.");

  const cached = getCachedWordSearchHistory(user.id, input.page, input.pageSize) as { rows: WordSearchSessionRow[]; total: number } | null;
  if (cached && !input.forceRefresh) return cached;

  const from = (input.page - 1) * input.pageSize;
  const to = from + input.pageSize - 1;
  const { data, error, count } = await supabase
    .from("word_search_sessions")
    .select("id, user_id, grid_size, difficulty, category, word_count, duration_seconds, words, started_at, completed_at, created_at", { count: "exact" })
    .eq("user_id", user.id)
    .order("completed_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to);

  if (error) throw error;
  const result = { rows: (data ?? []) as WordSearchSessionRow[], total: count ?? data?.length ?? 0 };
  setCachedWordSearchHistory(user.id, input.page, input.pageSize, result);
  return result;
}

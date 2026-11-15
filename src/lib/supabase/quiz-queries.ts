import type { VocabularyQuizAnswerRow, VocabularyQuizSessionRow } from "@/types/database";
import {
  getCachedQuizAnswers,
  getCachedQuizHistory,
  setCachedQuizAnswers,
  setCachedQuizHistory,
} from "@/lib/supabase/quiz-history-cache.mjs";
import { quizSupabase } from "@/lib/supabase/quiz-client";

export function getCachedVocabularyQuizHistory(userId: string, page = 1, pageSize = 10): { rows: VocabularyQuizSessionRow[]; total: number } | null {
  return getCachedQuizHistory(userId, page, pageSize);
}

export function getCachedVocabularyQuizAnswers(userId: string, sessionId: string): VocabularyQuizAnswerRow[] | null {
  return getCachedQuizAnswers(userId, sessionId);
}

export async function getVocabularyQuizHistory(input: {
  page: number;
  pageSize: number;
  forceRefresh?: boolean;
}): Promise<{ rows: VocabularyQuizSessionRow[]; total: number }> {
  const {
    data: { user },
    error: authError,
  } = await quizSupabase.auth.getUser();

  if (authError || !user) {
    throw new Error("You must be logged in to view quiz history.");
  }

  const cached = getCachedQuizHistory(user.id, input.page, input.pageSize);
  if (cached && !input.forceRefresh) return cached;

  const from = (input.page - 1) * input.pageSize;
  const to = from + input.pageSize - 1;
  const { data, error, count } = await quizSupabase
    .from("vocabulary_quiz_sessions")
    .select("id, user_id, mode, question_count, correct_count, is_perfect, duration_seconds, started_at, completed_at, created_at", { count: "exact" })
    .eq("user_id", user.id)
    .order("is_perfect", { ascending: false })
    .order("duration_seconds", { ascending: true })
    .order("completed_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to);

  if (error) throw error;
  const result = {
    rows: (data ?? []) as VocabularyQuizSessionRow[],
    total: count ?? data?.length ?? 0,
  };
  setCachedQuizHistory(user.id, input.page, input.pageSize, result);
  return result;
}

export async function getVocabularyQuizAnswers(sessionId: string): Promise<VocabularyQuizAnswerRow[]> {
  const {
    data: { user },
    error: authError,
  } = await quizSupabase.auth.getUser();

  if (authError || !user) {
    throw new Error("You must be logged in to review a quiz.");
  }

  const cached = getCachedQuizAnswers(user.id, sessionId);
  if (cached) return cached;

  const { data, error } = await quizSupabase
    .from("vocabulary_quiz_answers")
    .select("id, session_id, user_id, vocabulary_word_id, question_position, prompt_type, word_text, prompt_text, expected_answer, selected_answer, is_correct, part_of_speech, choices, image_path, created_at")
    .eq("session_id", sessionId)
    .eq("user_id", user.id)
    .order("question_position", { ascending: true });

  if (error) throw error;
  const answers = (data ?? []) as VocabularyQuizAnswerRow[];
  setCachedQuizAnswers(user.id, sessionId, answers);
  return answers;
}

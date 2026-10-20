import { createClient } from "@/lib/supabase/client";
import type {
  VocabularyQuizAnswerRow,
  VocabularyQuizMode,
  VocabularyQuizSessionRow,
} from "@/types/database";
import {
  getCachedQuizAnswers,
  getCachedQuizHistory,
  invalidateQuizHistoryCache,
  setCachedQuizAnswers,
  setCachedQuizHistory,
} from "@/lib/supabase/quiz-history-cache.mjs";

const supabase = createClient();

export function getCachedVocabularyQuizHistory(
  userId: string,
  page = 1,
  pageSize = 10
): { rows: VocabularyQuizSessionRow[]; total: number } | null {
  return getCachedQuizHistory(userId, page, pageSize);
}

export function getCachedVocabularyQuizAnswers(
  userId: string,
  sessionId: string
): VocabularyQuizAnswerRow[] | null {
  return getCachedQuizAnswers(userId, sessionId);
}

export function invalidateVocabularyQuizHistoryCache(userId?: string): void {
  if (userId) {
    invalidateQuizHistoryCache(userId);
  } else {
    invalidateQuizHistoryCache();
  }
}

export interface SaveVocabularyQuizAnswer {
  vocabulary_word_id: string;
  question_position: number;
  word_text: string;
  prompt_text: string;
  expected_answer: string;
  selected_answer: string;
  is_correct: boolean;
  part_of_speech: string | null;
  choices: string[];
  image_path: string | null;
}

export interface SaveVocabularyQuizSession {
  mode: VocabularyQuizMode;
  question_count: number;
  correct_count: number;
  duration_seconds: number;
  started_at: string;
  completed_at: string;
  answers: SaveVocabularyQuizAnswer[];
}

export async function saveVocabularyQuizSession(
  session: SaveVocabularyQuizSession
): Promise<string> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("You must be logged in to save quiz history.");
  }

  const { data, error } = await supabase.rpc("save_vocabulary_quiz_session", {
    p_mode: session.mode,
    p_question_count: session.question_count,
    p_correct_count: session.correct_count,
    p_duration_seconds: session.duration_seconds,
    p_started_at: session.started_at,
    p_completed_at: session.completed_at,
    p_answers: session.answers,
  });

  if (error) throw error;
  invalidateVocabularyQuizHistoryCache(user.id);
  return data as string;
}

export async function getVocabularyQuizHistory(input: {
  page: number;
  pageSize: number;
  forceRefresh?: boolean;
}): Promise<{ rows: VocabularyQuizSessionRow[]; total: number }> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("You must be logged in to view quiz history.");
  }

  const cached = getCachedQuizHistory(user.id, input.page, input.pageSize);
  if (cached && !input.forceRefresh) return cached;

  const from = (input.page - 1) * input.pageSize;
  const to = from + input.pageSize - 1;
  const { data, error, count } = await supabase
    .from("vocabulary_quiz_sessions")
    .select("id, user_id, mode, question_count, correct_count, duration_seconds, started_at, completed_at, created_at", { count: "exact" })
    .eq("user_id", user.id)
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

export async function getVocabularyQuizAnswers(
  sessionId: string
): Promise<VocabularyQuizAnswerRow[]> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("You must be logged in to review a quiz.");
  }

  const cached = getCachedQuizAnswers(user.id, sessionId);
  if (cached) return cached;

  const { data, error } = await supabase
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

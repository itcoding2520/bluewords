import type { VocabularyQuizMode } from "@/types/database";
import { invalidateQuizHistoryCache } from "@/lib/supabase/quiz-history-cache.mjs";
import { quizSupabase } from "@/lib/supabase/quiz-client";

export interface SaveVocabularyQuizAnswer {
  vocabulary_word_id: string | null;
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

export async function saveVocabularyQuizSession(session: SaveVocabularyQuizSession): Promise<string> {
  const {
    data: { user },
    error: authError,
  } = await quizSupabase.auth.getUser();

  if (authError || !user) {
    throw new Error("You must be logged in to save quiz history.");
  }

  const { data, error } = await quizSupabase.rpc("save_vocabulary_quiz_session", {
    p_mode: session.mode,
    p_question_count: session.question_count,
    p_correct_count: session.correct_count,
    p_duration_seconds: session.duration_seconds,
    p_started_at: session.started_at,
    p_completed_at: session.completed_at,
    p_answers: session.answers,
  });

  if (error) throw error;
  invalidateQuizHistoryCache(user.id);
  return data as string;
}

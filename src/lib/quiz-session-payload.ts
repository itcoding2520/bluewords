import type { QuizAnswer, QuizMode, QuizQuestion } from "@/lib/quiz-model";
import { expectedAnswer, promptText } from "@/lib/quiz-model";
import type { SaveVocabularyQuizSession } from "@/lib/supabase/quiz";

export function buildQuizSessionPayload({
  mode,
  questions,
  answers,
  correctCount,
  startedAt,
  completedAt,
}: {
  mode: QuizMode;
  questions: QuizQuestion[];
  answers: Record<number, QuizAnswer>;
  correctCount: number;
  startedAt: number;
  completedAt: number;
}): SaveVocabularyQuizSession {
  return {
    mode,
    question_count: questions.length,
    correct_count: correctCount,
    duration_seconds: Math.max(0, Math.floor((completedAt - startedAt) / 1000)),
    started_at: new Date(startedAt).toISOString(),
    completed_at: new Date(completedAt).toISOString(),
    answers: questions.map((question, index) => {
      const answer = answers[index];
      return {
        vocabulary_word_id: question.word.isCustom ? null : question.word.id,
        question_position: index + 1,
        word_text: question.word.word,
        prompt_text: promptText(question, mode),
        expected_answer: expectedAnswer(question, mode),
        selected_answer: answer?.value ?? "",
        is_correct: answer?.correct ?? false,
        part_of_speech: question.partOfSpeech,
        choices: question.choices,
        image_path: question.word.imagePath ?? null,
      };
    }),
  };
}

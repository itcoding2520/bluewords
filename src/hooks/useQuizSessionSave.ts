import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";

import { expectedAnswer, promptText, type QuizAnswer, type QuizMode, type QuizPhase, type QuizQuestion, type QuizSaveState } from "@/lib/quiz-model";
import { saveVocabularyQuizSession } from "@/lib/supabase/quiz";

export function useQuizSessionSave({
  userId,
  phase,
  startedAt,
  mode,
  questions,
  answers,
  correctCount,
  historyPageSize,
  setHistoryPage,
  setElapsedSeconds,
  loadHistory,
}: {
  userId: string | null;
  phase: QuizPhase;
  startedAt: number | null;
  mode: QuizMode;
  questions: QuizQuestion[];
  answers: Record<number, QuizAnswer>;
  correctCount: number;
  historyPageSize: number;
  setHistoryPage: Dispatch<SetStateAction<number>>;
  setElapsedSeconds: Dispatch<SetStateAction<number>>;
  loadHistory: (forceRefresh: boolean, page: number, pageSize: number) => Promise<void>;
}) {
  const [saveState, setSaveState] = useState<QuizSaveState>("idle");
  const [saveError, setSaveError] = useState("");
  const saveStartedRef = useRef<number | null>(null);

  useEffect(() => {
    if (!userId || phase !== "results" || startedAt === null || questions.length === 0 || saveStartedRef.current === startedAt) return;

    saveStartedRef.current = startedAt;
    const completedAt = Date.now();
    const durationSeconds = Math.max(0, Math.floor((completedAt - startedAt) / 1000));
    setElapsedSeconds(durationSeconds);
    setSaveState("saving");
    setSaveError("");

    void saveVocabularyQuizSession({
      mode,
      question_count: questions.length,
      correct_count: correctCount,
      duration_seconds: durationSeconds,
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
    }).then(() => {
      setSaveState("saved");
      setHistoryPage(1);
      void loadHistory(true, 1, historyPageSize);
    }).catch((error: unknown) => {
      saveStartedRef.current = null;
      setSaveState("error");
      setSaveError(error instanceof Error ? error.message : "Could not save this quiz attempt.");
    });
  }, [answers, correctCount, historyPageSize, loadHistory, mode, phase, questions, setElapsedSeconds, setHistoryPage, startedAt, userId]);

  const resetSaveState = useCallback(() => {
    setSaveState("idle");
    setSaveError("");
  }, []);

  const allowRetry = useCallback(() => {
    saveStartedRef.current = null;
  }, []);

  return { saveState, saveError, resetSaveState, allowRetry };
}

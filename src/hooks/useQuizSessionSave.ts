import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";

import type { QuizAnswer, QuizMode, QuizPhase, QuizQuestion, QuizSaveState } from "@/lib/quiz-model";
import { saveVocabularyQuizSession } from "@/lib/supabase/quiz";
import { buildQuizSessionPayload } from "@/lib/quiz-session-payload";

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
  setElapsedSeconds: (seconds: number) => void;
  loadHistory: (forceRefresh: boolean, page: number, pageSize: number) => Promise<void>;
}) {
  const [saveState, setSaveState] = useState<QuizSaveState>("idle");
  const [saveError, setSaveError] = useState("");
  const [retryRevision, setRetryRevision] = useState(0);
  const saveStartedRef = useRef<number | null>(null);
  const saveRequestId = useRef(0);

  useEffect(() => {
    if (!userId || phase !== "results" || startedAt === null || questions.length === 0 || saveStartedRef.current === startedAt) return;

    const requestId = ++saveRequestId.current;
    saveStartedRef.current = startedAt;
    const completedAt = Date.now();
    const payload = buildQuizSessionPayload({ mode, questions, answers, correctCount, startedAt, completedAt });
    setElapsedSeconds(payload.duration_seconds);
    setSaveState("saving");
    setSaveError("");

    void saveVocabularyQuizSession(payload).then(() => {
      if (requestId !== saveRequestId.current) return;
      setSaveState("saved");
      setHistoryPage(1);
      void loadHistory(true, 1, historyPageSize);
    }).catch((error: unknown) => {
      if (requestId !== saveRequestId.current) return;
      saveStartedRef.current = null;
      setSaveState("error");
      setSaveError(error instanceof Error ? error.message : "Could not save this quiz attempt.");
    });
  }, [answers, correctCount, historyPageSize, loadHistory, mode, phase, questions, retryRevision, setElapsedSeconds, setHistoryPage, startedAt, userId]);

  const retrySave = useCallback(() => {
    if (saveState !== "error") return;
    saveRequestId.current += 1;
    saveStartedRef.current = null;
    setSaveState("idle");
    setSaveError("");
    setRetryRevision((revision) => revision + 1);
  }, [saveState]);

  const resetSaveState = useCallback(() => {
    saveRequestId.current += 1;
    saveStartedRef.current = null;
    setSaveState("idle");
    setSaveError("");
  }, []);

  return { saveState, saveError, resetSaveState, retrySave };
}

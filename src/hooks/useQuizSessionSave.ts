import { getErrorMessage } from "@/lib/errors";
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
  const [saveStatus, setSaveStatus] = useState<{ state: QuizSaveState; error: string }>({ state: "idle", error: "" });
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
    setSaveStatus({ state: "saving", error: "" });

    void saveVocabularyQuizSession(payload).then(() => {
      if (requestId !== saveRequestId.current) return;
      setSaveStatus({ state: "saved", error: "" });
      setHistoryPage(1);
      void loadHistory(true, 1, historyPageSize);
    }).catch((error: unknown) => {
      if (requestId !== saveRequestId.current) return;
      saveStartedRef.current = null;
      setSaveStatus({ state: "error", error: getErrorMessage(error, "Could not save this quiz attempt.") });
    });
  }, [answers, correctCount, historyPageSize, loadHistory, mode, phase, questions, retryRevision, setElapsedSeconds, setHistoryPage, startedAt, userId]);

  const retrySave = useCallback(() => {
    if (saveStatus.state !== "error") return;
    saveRequestId.current += 1;
    saveStartedRef.current = null;
    setSaveStatus({ state: "idle", error: "" });
    setRetryRevision((revision) => revision + 1);
  }, [saveStatus.state]);

  const resetSaveState = useCallback(() => {
    saveRequestId.current += 1;
    saveStartedRef.current = null;
    setSaveStatus({ state: "idle", error: "" });
  }, []);

  return { saveState: saveStatus.state, saveError: saveStatus.error, resetSaveState, retrySave };
}

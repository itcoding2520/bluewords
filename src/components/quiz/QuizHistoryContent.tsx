"use client";

import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { QuizHistoryAttemptList } from "@/components/quiz/QuizHistoryAttemptList";
import type { VocabularyQuizSessionRow } from "@/types/database";

export function QuizHistoryContent({
  sessions,
  loading,
  error,
  formatTime,
  onOpenReview,
}: {
  sessions: VocabularyQuizSessionRow[];
  loading: boolean;
  error: string;
  formatTime: (seconds: number) => string;
  onOpenReview: (session: VocabularyQuizSessionRow) => void;
}) {
  return (
    <>
      {error && <AutoDismissMessage key={error} variant="error" className="mb-4">{error}</AutoDismissMessage>}
      {loading ? (
        <p className="py-10 text-center text-sm text-slate-500">Loading quiz history…</p>
      ) : sessions.length === 0 ? (
        <p className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">No completed quizzes yet. Your attempts will appear here.</p>
      ) : (
        <QuizHistoryAttemptList sessions={sessions} formatTime={formatTime} onOpenReview={onOpenReview} />
      )}
    </>
  );
}

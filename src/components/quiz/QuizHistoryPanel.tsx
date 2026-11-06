"use client";

import { Card } from "@/components/ui/Card";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { QuizHistoryDetail } from "@/components/quiz/QuizHistoryDetail";
import { QuizHistoryAttemptList } from "@/components/quiz/QuizHistoryAttemptList";
import { QuizHistoryHeader } from "@/components/quiz/QuizHistoryHeader";
import { QuizHistoryPagination } from "@/components/quiz/QuizHistoryPagination";
import type { VocabularyQuizAnswerRow, VocabularyQuizSessionRow } from "@/types/database";

type QuizHistoryPanelProps = {
  selected: VocabularyQuizSessionRow | null;
  answers: VocabularyQuizAnswerRow[];
  sessions: VocabularyQuizSessionRow[];
  loading: boolean;
  reviewLoading: boolean;
  error: string;
  total: number;
  page: number;
  pageSize: number;
  formatTime: (seconds: number) => string;
  onBack: () => void;
  onRefresh: () => void;
  onOpenReview: (session: VocabularyQuizSessionRow) => void;
  onPageSizeChange: (size: number) => void;
  onPageChange: (page: number) => void;
};

export function QuizHistoryPanel({
  selected,
  answers,
  sessions,
  loading,
  reviewLoading,
  error,
  total,
  page,
  pageSize,
  formatTime,
  onBack,
  onRefresh,
  onOpenReview,
  onPageSizeChange,
  onPageChange,
}: QuizHistoryPanelProps) {
  return (
    <Card className="quiz-history-card mx-auto max-w-none p-5 sm:p-8">
      {selected ? (
        <QuizHistoryDetail selected={selected} answers={answers} reviewLoading={reviewLoading} formatTime={formatTime} onBack={onBack} />
      ) : (
        <>
          <QuizHistoryHeader loading={loading} onRefresh={onRefresh} />
          {error && <AutoDismissMessage key={error} variant="error" className="mb-4">{error}</AutoDismissMessage>}
          {loading ? <p className="py-10 text-center text-sm text-slate-500">Loading quiz history…</p> : sessions.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">No completed quizzes yet. Your attempts will appear here.</p>
          ) : (
            <QuizHistoryAttemptList sessions={sessions} formatTime={formatTime} onOpenReview={onOpenReview} />
          )}
          {!loading && !error && total > 0 && (
            <QuizHistoryPagination total={total} page={page} pageSize={pageSize} onPageSizeChange={onPageSizeChange} onPageChange={onPageChange} />
          )}
        </>
      )}
    </Card>
  );
}

"use client";

import Image from "next/image";
import { RotateCcw, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { QuizHistoryDetail } from "@/components/quiz/QuizHistoryDetail";
import { QuizHistoryAttemptList } from "@/components/quiz/QuizHistoryAttemptList";
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
          <div className="quiz-history-heading mb-5 flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="text-3xl font-extrabold text-slate-950">Your quiz journey <Star aria-hidden="true" className="inline size-5 fill-amber-400 text-amber-400" /></h2><p className="mt-1 text-sm text-slate-500">Review scores, time, and answers from every completed quiz.</p></div>
            <Image src="/images/ui/illustrations/review-trophy.svg" alt="" width={240} height={150} className="quiz-history-art" />
            <Button variant="secondary" onClick={onRefresh} disabled={loading} className="quiz-history-refresh"><RotateCcw size={17} /> Refresh</Button>
          </div>
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

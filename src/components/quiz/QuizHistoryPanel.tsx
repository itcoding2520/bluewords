"use client";

import Image from "next/image";
import { ChevronDown, ChevronLeft, ChevronRight, RotateCcw, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { QuizHistoryDetail } from "@/components/quiz/QuizHistoryDetail";
import { QuizHistoryAttemptList } from "@/components/quiz/QuizHistoryAttemptList";
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
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

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
            <div className="quiz-history-pagination mt-5 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <p aria-live="polite">Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total} attempts</p>
              <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                <label className="flex items-center gap-2 whitespace-nowrap">
                  <span className="relative inline-flex">
                    <select aria-label="Quiz history rows per page" value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))} className="h-10 w-[76px] cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50">
                      {[10, 20, 50].map((size) => <option key={size} value={size}>{size}</option>)}
                    </select>
                    <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500"><ChevronDown size={15} /></span>
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="whitespace-nowrap">Page {page} of {pageCount}</span>
                  <Button variant="secondary" aria-label="Previous quiz history page" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1} className="size-10 px-0"><ChevronLeft size={17} /></Button>
                  <Button variant="secondary" aria-label="Next quiz history page" onClick={() => onPageChange(Math.min(pageCount, page + 1))} disabled={page >= pageCount} className="size-10 px-0"><ChevronRight size={17} /></Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

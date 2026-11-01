"use client";

import Image from "next/image";
import { BookOpen, ChevronDown, ChevronLeft, ChevronRight, Clock3, RotateCcw, Star, Trophy, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import type { QuizMode } from "@/lib/quiz-model";
import type { VocabularyQuizAnswerRow, VocabularyQuizSessionRow } from "@/types/database";

function modeLabel(mode: QuizMode) {
  return mode === "type-word" ? "Type the word" : "Choose the meaning";
}

function rating(score: number, total: number) {
  return total > 0 ? Math.round((score / total) * 5) : 0;
}

function HistoryAnswer({ answer }: { answer: VocabularyQuizAnswerRow }) {
  const correct = answer.is_correct;
  return <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 p-4"><div className="min-w-0"><p className="text-xs font-medium uppercase tracking-wide text-slate-400">Question {answer.question_position} · {answer.prompt_text}</p><p className="mt-1 font-semibold text-slate-900">{answer.word_text}</p>{answer.part_of_speech && <span className="mt-1 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs capitalize text-blue-700">{answer.part_of_speech}</span>}<p className="mt-2 text-sm text-slate-700">Correct answer: {answer.expected_answer}</p>{!correct && <p className="mt-1 text-sm text-red-600">Your answer: {answer.selected_answer || "No answer"}</p>}</div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${correct ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{correct ? "Correct" : "Review"}</span></div>;
}

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
        <>
          <button type="button" onClick={onBack} className="quiz-history-back mb-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"><ArrowLeft size={16} /> All quiz attempts</button>
          <div className="quiz-history-detail-heading mb-5">
            <h2 className="text-2xl font-extrabold text-slate-950">Quiz review</h2>
            <p className="mt-1 text-sm text-slate-500">{new Date(selected.completed_at).toLocaleString()} · {modeLabel(selected.mode)} · {formatTime(selected.duration_seconds)} · {selected.correct_count}/{selected.question_count} correct</p>
          </div>
          {reviewLoading ? <p className="py-8 text-center text-sm text-slate-500">Loading answers…</p> : (
            <div className="quiz-history-review-list space-y-3">
              {answers.map((answer) => <HistoryAnswer key={answer.id} answer={answer} />)}
              {answers.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No saved answers were found.</p>}
            </div>
          )}
        </>
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
            <div className="quiz-history-list space-y-3">
              {sessions.map((session) => <button key={session.id} type="button" aria-label={`Review quiz attempt: ${session.correct_count} of ${session.question_count} correct, ${modeLabel(session.mode)}, ${formatTime(session.duration_seconds)}`} onClick={() => onOpenReview(session)} className="quiz-history-attempt">
                <span className="quiz-history-score"><span className="quiz-history-medal"><Trophy size={30} fill="currentColor" /></span><span><strong>{session.correct_count}/{session.question_count}</strong><small>correct</small></span></span>
                <span role="img" aria-label={`${rating(session.correct_count, session.question_count)} out of 5 stars`} className="quiz-history-stars">{Array.from({ length: 5 }, (_, index) => <Star key={index} size={30} aria-hidden="true" fill={index < rating(session.correct_count, session.question_count) ? "currentColor" : "none"} />)}</span>
                <time className="quiz-history-date" dateTime={session.completed_at}>{new Date(session.completed_at).toLocaleString()}</time>
                <span className="quiz-history-mode"><BookOpen size={20} />{modeLabel(session.mode)}</span>
                <span className="quiz-history-duration"><Clock3 size={22} />{formatTime(session.duration_seconds)}</span>
                <span className="quiz-history-open" aria-hidden="true"><ChevronRight size={24} /></span>
              </button>)}
            </div>
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

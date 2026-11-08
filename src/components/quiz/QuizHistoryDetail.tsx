"use client";

import { ArrowLeft } from "lucide-react";
import { quizModeLabel } from "@/lib/quiz-mode-model";
import { formatQuizDate } from "@/lib/quiz-format";
import type { VocabularyQuizAnswerRow, VocabularyQuizSessionRow } from "@/types/database";

type QuizHistoryDetailProps = {
  selected: VocabularyQuizSessionRow;
  answers: VocabularyQuizAnswerRow[];
  reviewLoading: boolean;
  formatTime: (seconds: number) => string;
  onBack: () => void;
};

function HistoryAnswer({ answer }: { answer: VocabularyQuizAnswerRow }) {
  const correct = answer.is_correct;

  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 p-4">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Question {answer.question_position} · {answer.prompt_text}
        </p>
        <p className="mt-1 font-semibold text-slate-900">{answer.word_text}</p>
        {answer.part_of_speech && (
          <span className="mt-1 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs capitalize text-blue-700">
            {answer.part_of_speech}
          </span>
        )}
        <p className="mt-2 text-sm text-slate-700">Correct answer: {answer.expected_answer}</p>
        {!correct && (
          <p className="mt-1 text-sm text-red-600">Your answer: {answer.selected_answer || "No answer"}</p>
        )}
      </div>
      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${correct ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
        {correct ? "Correct" : "Review"}
      </span>
    </div>
  );
}

export function QuizHistoryDetail({ selected, answers, reviewLoading, formatTime, onBack }: QuizHistoryDetailProps) {
  return (
    <>
      <button type="button" onClick={onBack} className="quiz-history-back mb-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800">
        <ArrowLeft size={16} /> All quiz attempts
      </button>
      <div className="quiz-history-detail-heading mb-5">
        <h2 className="text-2xl font-extrabold text-slate-950">Quiz review</h2>
        <p className="mt-1 text-sm text-slate-500">
          {formatQuizDate(selected.completed_at)} · {quizModeLabel(selected.mode)} · {formatTime(selected.duration_seconds)} · {selected.correct_count}/{selected.question_count} correct
        </p>
      </div>
      {reviewLoading ? (
        <p className="py-8 text-center text-sm text-slate-500">Loading answers…</p>
      ) : (
        <div className="quiz-history-review-list space-y-3">
          {answers.map((answer) => <HistoryAnswer key={answer.id} answer={answer} />)}
          {answers.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No saved answers were found.</p>}
        </div>
      )}
    </>
  );
}

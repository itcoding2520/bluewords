"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Clock3 } from "lucide-react";
import { formatQuizTime } from "@/lib/quiz-format";
import { getQuizQuestionProgress } from "@/lib/quiz-model";
import { getQuizElapsedSeconds } from "@/lib/quiz-timing";

export function QuizGameStatusBar({
  questionIndex,
  questionCount,
  startedAt,
  elapsedSeconds,
  onExit,
}: {
  questionIndex: number;
  questionCount: number;
  startedAt: number | null;
  elapsedSeconds: number;
  onExit: () => void;
}) {
  const { currentQuestion, percentage } = getQuizQuestionProgress(questionIndex, questionCount);
  const [displayElapsedSeconds, setDisplayElapsedSeconds] = useState(() =>
    startedAt === null ? elapsedSeconds : getQuizElapsedSeconds(startedAt, elapsedSeconds)
  );

  useEffect(() => {
    if (startedAt === null) return;

    const updateElapsed = () => setDisplayElapsedSeconds(getQuizElapsedSeconds(startedAt, elapsedSeconds));
    updateElapsed();
    const interval = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(interval);
  }, [elapsedSeconds, startedAt]);

  return (
    <>
      <div className="quiz-game-topbar sticky top-25 z-20 -mx-5 -mt-5 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-t-2xl border-b border-slate-100 bg-white/95 px-5 py-3 backdrop-blur lg:top-0 lg:mx-0 lg:mt-0 lg:rounded-none lg:px-0 lg:py-0 lg:pb-4">
        <button type="button" onClick={onExit} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2">
          <ArrowLeft size={16} /> Exit quiz
        </button>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-500">Question {currentQuestion} of {questionCount}</span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700"><Clock3 size={16} /> {formatQuizTime(displayElapsedSeconds)}</span>
        </div>
      </div>
      <div className="quiz-game-progress mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${percentage}%` }} />
      </div>
    </>
  );
}

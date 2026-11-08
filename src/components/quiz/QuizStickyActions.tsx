"use client";

import { Gamepad2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { getQuizAdvanceLabel, type QuizMode, type QuizAnswer } from "@/lib/quiz-model";

export function QuizStickyActions({
  showStart,
  showGameAction,
  canStart,
  mode,
  input,
  answer,
  questionIndex,
  questionCount,
  onStart,
  onNext,
}: {
  showStart: boolean;
  showGameAction: boolean;
  canStart: boolean;
  mode: QuizMode;
  input: string;
  answer?: QuizAnswer;
  questionIndex: number;
  questionCount: number;
  onStart: () => void;
  onNext: () => void;
}) {
  if (!showStart && !showGameAction) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur sm:hidden">
      {showStart ? (
        <Button onClick={onStart} disabled={!canStart} className="min-h-12 w-full">
          <Gamepad2 size={17} /> Start quiz
        </Button>
      ) : mode === "type-word" && !answer ? (
        <Button type="submit" form="quiz-type-word-answer" disabled={!input.trim()} className="min-h-12 w-full">
          Check answer
        </Button>
      ) : (
        <Button onClick={onNext} className="min-h-12 w-full">
          {getQuizAdvanceLabel(questionIndex, questionCount)}
        </Button>
      )}
    </div>
  );
}

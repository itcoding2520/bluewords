"use client";

import { Card } from "@/components/ui/Card";
import type { QuizAnswer, QuizMode, QuizQuestion } from "@/lib/quiz-model";
import { QuizResultsAnswerList } from "@/components/quiz/QuizResultsAnswerList";
import { QuizResultsActions } from "@/components/quiz/QuizResultsActions";
import { QuizResultsSummary, type QuizSaveState } from "@/components/quiz/QuizResultsSummary";

export function QuizResultsPanel({
  questions,
  answers,
  mode,
  correctCount,
  elapsedSeconds,
  saveState,
  saveError,
  onSetup,
  onPlayAgain,
  onRetrySave,
}: {
  questions: QuizQuestion[];
  answers: Record<number, QuizAnswer>;
  mode: QuizMode;
  correctCount: number;
  elapsedSeconds: number;
  saveState: QuizSaveState;
  saveError: string;
  onSetup: () => void;
  onPlayAgain: () => void;
  onRetrySave: () => void;
}) {
  return (
    <Card className="mx-auto max-w-3xl p-5 sm:p-8">
      <QuizResultsActions onSetup={onSetup} onPlayAgain={onPlayAgain} />
      <QuizResultsSummary
        correctCount={correctCount}
        questionCount={questions.length}
        elapsedSeconds={elapsedSeconds}
        saveState={saveState}
        saveError={saveError}
        onRetrySave={onRetrySave}
      />
      <QuizResultsAnswerList questions={questions} answers={answers} mode={mode} />
    </Card>
  );
}

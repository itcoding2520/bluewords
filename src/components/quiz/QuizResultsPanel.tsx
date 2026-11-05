"use client";

import { ArrowLeft, LoaderCircle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { formatQuizTime, type QuizAnswer, type QuizMode, type QuizQuestion } from "@/lib/quiz-model";
import { QuizResultsAnswerList } from "@/components/quiz/QuizResultsAnswerList";

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
  saveState: "idle" | "saving" | "saved" | "error";
  saveError: string;
  onSetup: () => void;
  onPlayAgain: () => void;
  onRetrySave: () => void;
}) {
  return (
    <Card className="mx-auto max-w-3xl p-5 sm:p-8">
      <div className="mb-5 flex flex-wrap justify-between gap-2"><Button variant="secondary" onClick={onSetup}><ArrowLeft size={16} /> Setup</Button><Button onClick={onPlayAgain}><RotateCcw size={16} /> Play again</Button></div>
      <div className="text-center"><p className="text-sm font-medium text-blue-600">Quiz complete</p><h2 className="mt-2 text-3xl font-bold text-slate-950">{correctCount} / {questions.length}</h2><p className="mt-2 text-sm text-slate-500">Correct answers · {formatQuizTime(elapsedSeconds)} elapsed</p>
        {saveState === "saving" && <p role="status" className="mt-3 inline-flex items-center gap-2 text-sm text-slate-500"><LoaderCircle size={15} className="animate-spin" />Saving your quiz history…</p>}
        {saveState === "saved" && <AutoDismissMessage variant="success" className="mx-auto mt-3 w-fit">Attempt saved to your history.</AutoDismissMessage>}
        {saveState === "error" && <AutoDismissMessage key={saveError} variant="error" className="mx-auto mt-3 w-fit">History was not saved: {saveError}</AutoDismissMessage>}
        {saveState === "error" && <button type="button" onClick={onRetrySave} className="ml-2 text-sm font-semibold text-blue-700 underline">Retry save</button>}
      </div>
      <QuizResultsAnswerList questions={questions} answers={answers} mode={mode} />
    </Card>
  );
}

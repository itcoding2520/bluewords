"use client";

import { ArrowLeft, LoaderCircle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { expectedAnswer, formatQuizTime, type QuizAnswer, type QuizMode, type QuizQuestion } from "@/lib/quiz-model";

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
      <div className="mt-7 flex flex-col gap-3">{questions.map((question, index) => { const answer = answers[index]; const expected = expectedAnswer(question, mode); const prompt = mode === "choose-meaning" && question.choiceType === "word" ? question.meaning : question.word.word; return <div key={`${question.word.id}-${index}`} className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 p-4"><div className="min-w-0"><p className="font-semibold text-slate-900">{prompt}</p>{mode === "choose-meaning" && <p className="mt-1 text-sm text-slate-600">Correct answer: {expected}</p>}{!answer ? <p className="mt-1 text-xs text-slate-400">Not answered</p> : !answer.correct ? <p className="mt-1 text-xs text-red-600">Your answer: {answer.value}</p> : null}</div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${answer?.correct ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{answer?.correct ? "Correct" : "Review"}</span></div>; })}</div>
    </Card>
  );
}

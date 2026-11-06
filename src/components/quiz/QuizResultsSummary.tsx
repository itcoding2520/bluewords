"use client";

import { LoaderCircle } from "lucide-react";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { formatQuizTime } from "@/lib/quiz-model";

export type QuizSaveState = "idle" | "saving" | "saved" | "error";

export function QuizResultsSummary({
  correctCount,
  questionCount,
  elapsedSeconds,
  saveState,
  saveError,
  onRetrySave,
}: {
  correctCount: number;
  questionCount: number;
  elapsedSeconds: number;
  saveState: QuizSaveState;
  saveError: string;
  onRetrySave: () => void;
}) {
  return (
    <div className="text-center">
      <p className="text-sm font-medium text-blue-600">Quiz complete</p>
      <h2 className="mt-2 text-3xl font-bold text-slate-950">{correctCount} / {questionCount}</h2>
      <p className="mt-2 text-sm text-slate-500">Correct answers · {formatQuizTime(elapsedSeconds)} elapsed</p>
      {saveState === "saving" && (
        <p role="status" className="mt-3 inline-flex items-center gap-2 text-sm text-slate-500">
          <LoaderCircle size={15} className="animate-spin" />Saving your quiz history…
        </p>
      )}
      {saveState === "saved" && <AutoDismissMessage variant="success" className="mx-auto mt-3 w-fit">Attempt saved to your history.</AutoDismissMessage>}
      {saveState === "error" && <AutoDismissMessage key={saveError} variant="error" className="mx-auto mt-3 w-fit">History was not saved: {saveError}</AutoDismissMessage>}
      {saveState === "error" && <button type="button" onClick={onRetrySave} className="ml-2 text-sm font-semibold text-blue-700 underline">Retry save</button>}
    </div>
  );
}

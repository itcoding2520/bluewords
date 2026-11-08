"use client";

import { ArrowRight, Play } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { MIN_QUIZ_QUESTION_COUNT, QUIZ_QUESTION_COUNTS, type QuizMode } from "@/lib/quiz-model";

export function QuizQuestionCountSelector({
  mode,
  questionCount,
  onQuestionCountChange,
  maximumQuestions,
  onStart,
}: {
  mode: QuizMode;
  questionCount: number;
  onQuestionCountChange: (count: number) => void;
  maximumQuestions: number;
  onStart: () => void;
}) {
  return (
    <>
      <fieldset className="mt-6">
        <legend className="mb-3 text-sm font-semibold text-slate-700">Number of words</legend>
        <div className="flex flex-wrap gap-2">
          {QUIZ_QUESTION_COUNTS.map((count) => (
            <ChoiceButton
              key={count}
              active={questionCount === count}
              disabled={count > maximumQuestions}
              onClick={() => onQuestionCountChange(count)}
            >
              {count}
            </ChoiceButton>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">{maximumQuestions} eligible questions available. Only complete sets of {QUIZ_QUESTION_COUNTS.join(", ")} can be started.</p>
      </fieldset>
      {maximumQuestions < MIN_QUIZ_QUESTION_COUNT && <AutoDismissMessage variant="warning" className="mt-5">
        {mode === "type-word" ? `Add images to at least ${MIN_QUIZ_QUESTION_COUNT} vocabulary words to play this question type.` : `Add at least ${MIN_QUIZ_QUESTION_COUNT} eligible vocabulary words with enough distinct words or meanings to create answer choices.`}
      </AutoDismissMessage>}
      <div className="quiz-start-row mt-7 hidden justify-end sm:flex">
        <Button onClick={onStart} disabled={maximumQuestions < questionCount}>
          <Play size={18} fill="currentColor" /> Start quiz <ArrowRight className="quiz-start-arrow" size={18} />
        </Button>
      </div>
    </>
  );
}

function ChoiceButton({ active, disabled = false, onClick, children }: { active: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-pressed={active} disabled={disabled} onClick={onClick} className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50"}`}>{children}</button>;
}

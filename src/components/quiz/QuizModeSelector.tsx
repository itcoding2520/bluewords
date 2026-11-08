"use client";

import { Check } from "lucide-react";

import type { QuizMode } from "@/lib/quiz-model";
import { QUIZ_MODE_OPTIONS } from "@/lib/quiz-mode-model";

export function QuizModeSelector({
  mode,
  onModeChange,
  meaningQuestionCount,
  typeWordCount,
}: {
  mode: QuizMode;
  onModeChange: (mode: QuizMode) => void;
  meaningQuestionCount: number;
  typeWordCount: number;
}) {
  return (
    <fieldset className="mt-6">
      <legend className="mb-3 text-sm font-semibold text-slate-700">Question type</legend>
      <div className="grid grid-cols-2 gap-2 sm:hidden">
        <CompactModeButton active={mode === "choose-meaning"} title={QUIZ_MODE_OPTIONS["choose-meaning"].compactLabel} count={meaningQuestionCount} onClick={() => onModeChange("choose-meaning")} />
        <CompactModeButton active={mode === "type-word"} title={QUIZ_MODE_OPTIONS["type-word"].compactLabel} count={typeWordCount} onClick={() => onModeChange("type-word")} />
      </div>
      <div className="hidden gap-3 sm:grid sm:grid-cols-2">
        <ModeCard active={mode === "choose-meaning"} title={QUIZ_MODE_OPTIONS["choose-meaning"].label} description={QUIZ_MODE_OPTIONS["choose-meaning"].description} count={meaningQuestionCount} onClick={() => onModeChange("choose-meaning")} />
        <ModeCard active={mode === "type-word"} title={QUIZ_MODE_OPTIONS["type-word"].label} description={QUIZ_MODE_OPTIONS["type-word"].description} count={typeWordCount} onClick={() => onModeChange("type-word")} />
      </div>
    </fieldset>
  );
}

function ModeCard({ active, title, description, count, onClick }: { active: boolean; title: string; description: string; count: number; onClick: () => void }) {
  const icon = title.startsWith("Choose") ? "💬" : "✏️";
  return <button type="button" aria-pressed={active} onClick={onClick} className={`quiz-mode-card cursor-pointer rounded-xl border p-4 text-left transition ${active ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 hover:border-blue-200 hover:bg-slate-50"}`}><span className="flex items-center gap-3"><span className="quiz-mode-illustration" aria-hidden="true">{icon}</span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="font-bold text-slate-900">{title}</span><span className="quiz-mode-check">{active ? <Check size={14} strokeWidth={3} /> : null}</span></span><span className="mt-1 block text-xs leading-4 text-slate-500">{description}</span></span></span><span className="quiz-mode-count">{count} words available</span></button>;
}

function CompactModeButton({ active, title, count, onClick }: { active: boolean; title: string; count: number; onClick: () => void }) {
  const icon = title.startsWith("Choose") ? "💬" : "✏️";
  return <button type="button" aria-pressed={active} aria-label={`${title}, ${count} available`} onClick={onClick} className={`flex min-h-[68px] min-w-0 flex-col items-start justify-center rounded-xl border px-3 py-2 text-left transition ${active ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 bg-white hover:border-blue-200"}`}><span className="flex items-center gap-1.5 text-sm font-semibold leading-5 text-slate-900"><span aria-hidden="true">{icon}</span>{title}</span><span className="mt-0.5 text-xs text-slate-500">{count} available</span></button>;
}

"use client";

import { ArrowRight, Gamepad2, Play, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { QuizPreview } from "@/components/quiz/QuizPreview";
import { QuizCategorySelector, type QuizCategoryOption } from "@/components/quiz/QuizCategorySelector";
import { QuizModeSelector } from "@/components/quiz/QuizModeSelector";
import type { VocabularyWord } from "@/data/vocabulary";
import type { QuizMode, QuizQuestion } from "@/lib/quiz-model";

const QUESTION_COUNTS = [10, 20, 30] as const;

export function QuizSetupPanel({
  mode,
  onModeChange,
  category,
  onCategoryChange,
  categoriesExpanded,
  onToggleCategories,
  questionCount,
  onQuestionCountChange,
  maximumQuestions,
  meaningQuestions,
  typeWordCount,
  categoryOptions,
  previewMeaningQuestion,
  previewTypeWord,
  onStart,
}: {
  mode: QuizMode;
  onModeChange: (mode: QuizMode) => void;
  category: string;
  onCategoryChange: (category: string) => void;
  categoriesExpanded: boolean;
  onToggleCategories: () => void;
  questionCount: number;
  onQuestionCountChange: (count: number) => void;
  maximumQuestions: number;
  meaningQuestions: QuizQuestion[];
  typeWordCount: number;
  categoryOptions: QuizCategoryOption[];
  previewMeaningQuestion: QuizQuestion | undefined;
  previewTypeWord: VocabularyWord | undefined;
  onStart: () => void;
}) {
  return (
    <div className="quiz-setup-grid grid items-stretch gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card className="quiz-setup-card min-w-0 p-5 sm:p-8">
        <div className="quiz-setup-heading flex items-start gap-3"><span className="quiz-setup-icon grid size-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600"><Gamepad2 size={25} /></span><div><h2 className="text-lg font-semibold text-slate-950">Set up your game</h2><p className="mt-1 text-sm text-slate-500">Choose a category, question type, and number of words. There’s no time limit.</p></div><Sparkles aria-hidden="true" className="quiz-setup-spark ml-auto mt-2 size-6 shrink-0" /></div>
        <QuizModeSelector
          mode={mode}
          onModeChange={onModeChange}
          meaningQuestionCount={meaningQuestions.length}
          typeWordCount={typeWordCount}
        />
        <QuizCategorySelector
          options={categoryOptions}
          selectedCategory={category}
          expanded={categoriesExpanded}
          onCategoryChange={onCategoryChange}
          onToggleExpanded={onToggleCategories}
        />
        <fieldset className="mt-6"><legend className="mb-3 text-sm font-semibold text-slate-700">Number of words</legend><div className="flex flex-wrap gap-2">
          {QUESTION_COUNTS.map((count) => <ChoiceButton key={count} active={questionCount === count} disabled={count > maximumQuestions} onClick={() => onQuestionCountChange(count)}>{count}</ChoiceButton>)}
        </div><p className="mt-2 text-xs text-slate-500">{maximumQuestions} eligible questions available. Only complete sets of 10, 20, or 30 can be started.</p></fieldset>
        {maximumQuestions < 10 && <AutoDismissMessage variant="warning" className="mt-5">{mode === "type-word" ? "Add images to at least 10 vocabulary words to play this question type." : "Add at least 10 eligible vocabulary words with enough distinct words or meanings to create answer choices."}</AutoDismissMessage>}
        <div className="quiz-start-row mt-7 hidden justify-end sm:flex"><Button onClick={onStart} disabled={maximumQuestions < questionCount}><Play size={18} fill="currentColor" /> Start quiz <ArrowRight className="quiz-start-arrow" size={18} /></Button></div>
      </Card>
      <QuizPreview mode={mode} category={category} questionCount={questionCount} meaningQuestion={previewMeaningQuestion} typeWord={previewTypeWord} />
    </div>
  );
}

function ChoiceButton({ active, disabled = false, onClick, children }: { active: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-pressed={active} disabled={disabled} onClick={onClick} className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50"}`}>{children}</button>;
}

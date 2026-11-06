"use client";

import { Gamepad2, Sparkles } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { QuizPreview } from "@/components/quiz/QuizPreview";
import { QuizCategorySelector, type QuizCategoryOption } from "@/components/quiz/QuizCategorySelector";
import { QuizModeSelector } from "@/components/quiz/QuizModeSelector";
import { QuizQuestionCountSelector } from "@/components/quiz/QuizQuestionCountSelector";
import type { VocabularyWord } from "@/data/vocabulary";
import type { QuizMode, QuizQuestion } from "@/lib/quiz-model";

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
        <QuizQuestionCountSelector
          mode={mode}
          questionCount={questionCount}
          onQuestionCountChange={onQuestionCountChange}
          maximumQuestions={maximumQuestions}
          onStart={onStart}
        />
      </Card>
      <QuizPreview mode={mode} category={category} questionCount={questionCount} meaningQuestion={previewMeaningQuestion} typeWord={previewTypeWord} />
    </div>
  );
}

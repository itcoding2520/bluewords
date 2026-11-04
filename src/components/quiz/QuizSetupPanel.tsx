"use client";

import Image from "next/image";
import { ArrowRight, Check, ChevronDown, ChevronUp, Gamepad2, Play, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { QuizPreview } from "@/components/quiz/QuizPreview";
import { useVocabularyImageUrl } from "@/hooks/useVocabularyImageUrl";
import { getCategoryImageUrl } from "@/lib/supabase/category-images";
import type { VocabularyCategoryColor } from "@/lib/supabase/categories";
import type { VocabularyWord } from "@/data/vocabulary";
import type { QuizMode, QuizQuestion } from "@/lib/quiz-model";

const QUESTION_COUNTS = [10, 20, 30] as const;
const CATEGORY_DOT_STYLES: Record<VocabularyCategoryColor, string> = {
  blue: "bg-blue-500",
  violet: "bg-violet-500",
  orange: "bg-orange-500",
  green: "bg-emerald-500",
  rose: "bg-rose-500",
  indigo: "bg-indigo-500",
  teal: "bg-teal-500",
  amber: "bg-amber-500",
  pink: "bg-pink-500",
  slate: "bg-slate-500",
};

export type QuizCategoryOption = {
  id: string;
  name: string;
  value: string;
  color: VocabularyCategoryColor;
  imagePath: string | null;
};

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
        <fieldset className="mt-6"><legend className="mb-3 text-sm font-semibold text-slate-700">Question type</legend>
          <div className="grid grid-cols-2 gap-2 sm:hidden">
            <CompactModeButton active={mode === "choose-meaning"} title="Choose meaning" count={meaningQuestions.length} onClick={() => onModeChange("choose-meaning")} />
            <CompactModeButton active={mode === "type-word"} title="Type word" count={typeWordCount} onClick={() => onModeChange("type-word")} />
          </div>
          <div className="hidden gap-3 sm:grid sm:grid-cols-2">
            <ModeCard active={mode === "choose-meaning"} title="Choose the meaning" description="Match a word or meaning with the correct answer from four choices." count={meaningQuestions.length} onClick={() => onModeChange("choose-meaning")} />
            <ModeCard active={mode === "type-word"} title="Type the word" description="Look at an image and type the vocabulary word." count={typeWordCount} onClick={() => onModeChange("type-word")} />
          </div>
        </fieldset>
        <fieldset className="mt-6"><legend className="mb-3 text-sm font-semibold text-slate-700">Category</legend><p className="mb-3 text-xs text-slate-500">Choose a category for this quiz.</p>
          <div id="quiz-categories" className={`grid grid-cols-3 gap-2 overflow-hidden transition-[max-height] duration-200 sm:grid-cols-5 ${categoriesExpanded ? "max-h-[1000px]" : "max-h-[11.5rem] sm:max-h-[5.5rem] lg:max-h-[11.5rem]"}`}>
            {categoryOptions.map((item) => <QuizCategoryChip key={item.id} name={item.name} imagePath={item.imagePath} dotClassName={CATEGORY_DOT_STYLES[item.color]} selected={category === item.value} onClick={() => onCategoryChange(item.value)} />)}
          </div>
          {categoryOptions.length > 8 && <div className={`mt-2 flex justify-center ${categoryOptions.length <= 12 ? "hidden" : ""} ${categoryOptions.length <= 10 ? "sm:hidden" : "sm:flex"} ${categoryOptions.length <= 20 ? "lg:hidden" : "lg:flex"}`}>
            <button type="button" aria-expanded={categoriesExpanded} aria-controls="quiz-categories" onClick={onToggleCategories} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">
              {categoriesExpanded ? "Show less" : "More"}{categoriesExpanded ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
            </button>
          </div>}
          <p className="mt-2 text-xs text-slate-500">Questions and answer choices will use words from this category.</p>
        </fieldset>
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

function QuizCategoryChip({ name, imagePath, dotClassName, selected, onClick }: { name: string; imagePath: string | null; dotClassName: string; selected: boolean; onClick: () => void }) {
  const isCategoryImage = imagePath?.startsWith("category:") ?? false;
  const wordImageUrl = useVocabularyImageUrl(isCategoryImage ? null : imagePath);
  const imageUrl = isCategoryImage ? getCategoryImageUrl(imagePath?.slice("category:".length)) : wordImageUrl;
  return <button type="button" aria-pressed={selected} onClick={onClick} title={name} className={`quiz-category-chip flex h-10 min-w-0 items-center gap-1.5 rounded-full border px-2 text-left text-xs transition sm:gap-2 sm:px-2.5 ${selected ? "border-indigo-200 bg-indigo-50 font-semibold text-indigo-700" : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50"}`}>
    {imageUrl ? <Image src={imageUrl} alt="" width={24} height={24} unoptimized className="size-6 shrink-0 rounded-full object-cover" /> : <span className={`size-2 shrink-0 rounded-full ${dotClassName}`} aria-hidden="true" />}
    <span className="min-w-0 truncate">{name}</span>
  </button>;
}

function ModeCard({ active, title, description, count, onClick }: { active: boolean; title: string; description: string; count: number; onClick: () => void }) {
  const icon = title.startsWith("Choose") ? "💬" : "✏️";
  return <button type="button" aria-pressed={active} onClick={onClick} className={`quiz-mode-card cursor-pointer rounded-xl border p-4 text-left transition ${active ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 hover:border-blue-200 hover:bg-slate-50"}`}><span className="flex items-center gap-3"><span className="quiz-mode-illustration" aria-hidden="true">{icon}</span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="font-bold text-slate-900">{title}</span><span className="quiz-mode-check">{active ? <Check size={14} strokeWidth={3} /> : null}</span></span><span className="mt-1 block text-xs leading-4 text-slate-500">{description}</span></span></span><span className="quiz-mode-count">{count} words available</span></button>;
}

function CompactModeButton({ active, title, count, onClick }: { active: boolean; title: string; count: number; onClick: () => void }) {
  return <button type="button" aria-pressed={active} aria-label={`${title}, ${count} available`} onClick={onClick} className={`flex min-h-[68px] min-w-0 flex-col items-start justify-center rounded-xl border px-3 py-2 text-left transition ${active ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 bg-white hover:border-blue-200"}`}><span className="flex items-center gap-1.5 text-sm font-semibold leading-5 text-slate-900"><span aria-hidden="true">{title.startsWith("Choose") ? "💬" : "✏️"}</span>{title}</span><span className="mt-0.5 text-xs text-slate-500">{count} available</span></button>;
}

function ChoiceButton({ active, disabled = false, onClick, children }: { active: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-pressed={active} disabled={disabled} onClick={onClick} className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50"}`}>{children}</button>;
}

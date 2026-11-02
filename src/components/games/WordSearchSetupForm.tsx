"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { ChevronDown, ChevronUp, Gamepad2, Grid3X3 } from "lucide-react";

import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useVocabularyImageUrl } from "@/hooks/useVocabularyImageUrl";
import { getCategoryImageUrl } from "@/lib/supabase/category-images";
import type { VocabularyCategoryColor } from "@/lib/supabase/categories";
import { DIFFICULTIES, GRID_SIZES, WORD_TARGETS, type Difficulty, type GridSize } from "@/lib/word-search-config";

const CATEGORY_DOT_STYLES: Record<VocabularyCategoryColor, string> = {
  blue: "bg-blue-500", violet: "bg-violet-500", orange: "bg-orange-500", green: "bg-emerald-500", rose: "bg-rose-500",
  indigo: "bg-indigo-500", teal: "bg-teal-500", amber: "bg-amber-500", pink: "bg-pink-500", slate: "bg-slate-500",
};

export type WordSearchCategoryOption = {
  id: string;
  name: string;
  value: string;
  color: VocabularyCategoryColor;
  imagePath: string | null;
};

function CategoryChip({
  option,
  selected,
  onClick,
}: {
  option: WordSearchCategoryOption;
  selected: boolean;
  onClick: () => void;
}) {
  const isCategoryImage = option.imagePath?.startsWith("category:") ?? false;
  const wordImageUrl = useVocabularyImageUrl(isCategoryImage ? null : option.imagePath);
  const imageUrl = isCategoryImage ? getCategoryImageUrl(option.imagePath?.slice("category:".length)) : wordImageUrl;

  return (
    <button type="button" aria-pressed={selected} onClick={onClick} title={option.name} className={`flex h-10 min-w-0 items-center gap-1.5 rounded-full border px-2 text-left text-xs transition sm:gap-2 sm:px-2.5 ${selected ? "border-indigo-200 bg-indigo-50 font-semibold text-indigo-700" : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50"}`}>
      {option.name === "All categories" ? <Grid3X3 size={21} className="shrink-0 text-violet-600" aria-hidden="true" /> : imageUrl ? <Image src={imageUrl} alt="" width={24} height={24} unoptimized className="size-6 shrink-0 rounded-full object-cover" /> : <span className={`size-2 shrink-0 rounded-full ${CATEGORY_DOT_STYLES[option.color]}`} aria-hidden="true" />}
      <span className="min-w-0 truncate">{option.name}</span>
    </button>
  );
}

function ChoiceButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={`min-h-12 cursor-pointer rounded-xl border p-3 text-sm font-semibold transition ${active ? "border-blue-500 bg-blue-600 text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50"}`}>{children}</button>;
}

export function WordSearchSetupForm({
  gridSize,
  difficulty,
  category,
  categoriesExpanded,
  categoryOptions,
  targetCount,
  gameError,
  preview,
  onGridSizeChange,
  onDifficultyChange,
  onCategoryChange,
  onCategoriesExpandedChange,
  onStart,
}: {
  gridSize: GridSize;
  difficulty: Difficulty;
  category: string;
  categoriesExpanded: boolean;
  categoryOptions: WordSearchCategoryOption[];
  targetCount: number;
  gameError: string;
  preview: ReactNode;
  onGridSizeChange: (size: GridSize) => void;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onCategoryChange: (category: string) => void;
  onCategoriesExpandedChange: () => void;
  onStart: () => void;
}) {
  return (
    <div className="word-search-setup-layout grid items-stretch gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card className="word-search-setup-card flex min-w-0 flex-col p-5 sm:p-8">
        <div className="grid gap-5 xl:grid-cols-2">
          <fieldset className="min-w-0">
            <legend className="mb-3 text-sm font-semibold text-slate-700">Grid size</legend>
            <div className="grid grid-cols-3 gap-2">{GRID_SIZES.map((size) => <ChoiceButton key={size} active={gridSize === size} onClick={() => onGridSizeChange(size)}>{size} × {size}</ChoiceButton>)}</div>
          </fieldset>
          <fieldset className="min-w-0">
            <legend className="mb-3 text-sm font-semibold text-slate-700">Level</legend>
            <div className="grid grid-cols-3 gap-2">{DIFFICULTIES.map((option) => <button key={option.value} type="button" aria-pressed={difficulty === option.value} onClick={() => onDifficultyChange(option.value)} className={`min-h-12 rounded-xl border px-2 text-center text-sm transition ${difficulty === option.value ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 hover:border-blue-200"}`}><span className="block truncate font-semibold text-slate-900">{option.label}</span></button>)}</div>
          </fieldset>
        </div>

        <fieldset className="word-search-category-fieldset mt-6">
          <legend className="mb-3 flex items-center gap-2 text-lg font-extrabold text-indigo-950"><Image src="/images/ui/icons/vocabulary.svg" alt="" width={24} height={24} /> Category</legend>
          <p className="mb-3 text-xs text-slate-500">Pick one category or use all your words.</p>
          <div id="word-search-categories" className={`grid grid-cols-3 gap-2 overflow-hidden transition-[max-height] duration-200 sm:grid-cols-5 ${categoriesExpanded ? "max-h-[1000px]" : "max-h-[11.5rem] sm:max-h-[5.5rem] lg:max-h-[11.5rem]"}`}>
            {categoryOptions.map((option) => <CategoryChip key={option.id} option={option} selected={category === option.value} onClick={() => onCategoryChange(option.value)} />)}
          </div>
          {categoryOptions.length > 8 && <div className={`mt-2 flex justify-center ${categoryOptions.length <= 12 ? "hidden" : ""} ${categoryOptions.length <= 10 ? "sm:hidden" : "sm:flex"} ${categoryOptions.length <= 20 ? "lg:hidden" : "lg:flex"}`}>
            <button type="button" aria-expanded={categoriesExpanded} aria-controls="word-search-categories" onClick={onCategoriesExpandedChange} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">
              {categoriesExpanded ? "Show less" : "More"}{categoriesExpanded ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
            </button>
          </div>}
        </fieldset>

        {targetCount < WORD_TARGETS[gridSize][difficulty] && targetCount > 0 && <AutoDismissMessage variant="warning" className="mt-5">Only {targetCount} words match this category and difficulty. The round will use the available words.</AutoDismissMessage>}
        {targetCount === 0 && <AutoDismissMessage variant="warning" className="mt-5">No words fit this difficulty and category. Try All categories or an easier level.</AutoDismissMessage>}
        {gameError && <AutoDismissMessage key={gameError} variant="error" className="mt-4">{gameError}</AutoDismissMessage>}

        <div className="mt-auto flex flex-col gap-3 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">Words can appear left-to-right, top-to-bottom, or diagonally downward.</p>
          <Button onClick={onStart} disabled={targetCount === 0} className="word-search-start-button hidden min-h-14 w-full sm:inline-flex sm:w-auto" style={{ minWidth: 180 }}><Gamepad2 size={19} /> Start game</Button>
        </div>
      </Card>
      {preview}
    </div>
  );
}

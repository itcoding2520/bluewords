"use client";

import Image from "next/image";
import { ChevronDown, ChevronUp } from "lucide-react";

import { useVocabularyImageUrl } from "@/hooks/useVocabularyImageUrl";
import { getCategoryImageUrl } from "@/lib/supabase/category-images";
import type { VocabularyCategoryColor } from "@/lib/supabase/categories";

export type QuizCategoryOption = {
  id: string;
  name: string;
  value: string;
  color: VocabularyCategoryColor;
  imagePath: string | null;
};

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

export function QuizCategorySelector({
  options,
  selectedCategory,
  expanded,
  onCategoryChange,
  onToggleExpanded,
}: {
  options: QuizCategoryOption[];
  selectedCategory: string;
  expanded: boolean;
  onCategoryChange: (category: string) => void;
  onToggleExpanded: () => void;
}) {
  return (
    <fieldset className="mt-6">
      <legend className="mb-3 text-sm font-semibold text-slate-700">Category</legend>
      <p className="mb-3 text-xs text-slate-500">Choose a category for this quiz.</p>
      <div id="quiz-categories" className={`grid grid-cols-3 gap-2 overflow-hidden transition-[max-height] duration-200 sm:grid-cols-5 ${expanded ? "max-h-[1000px]" : "max-h-[11.5rem] sm:max-h-[5.5rem] lg:max-h-[11.5rem]"}`}>
        {options.map((item) => (
          <QuizCategoryChip
            key={item.id}
            name={item.name}
            imagePath={item.imagePath}
            dotClassName={CATEGORY_DOT_STYLES[item.color]}
            selected={selectedCategory === item.value}
            onClick={() => onCategoryChange(item.value)}
          />
        ))}
      </div>
      {options.length > 8 && <div className={`mt-2 flex justify-center ${options.length <= 12 ? "hidden" : ""} ${options.length <= 10 ? "sm:hidden" : "sm:flex"} ${options.length <= 20 ? "lg:hidden" : "lg:flex"}`}>
        <button type="button" aria-expanded={expanded} aria-controls="quiz-categories" onClick={onToggleExpanded} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">
          {expanded ? "Show less" : "More"}{expanded ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
        </button>
      </div>}
      <p className="mt-2 text-xs text-slate-500">Questions and answer choices will use words from this category.</p>
    </fieldset>
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

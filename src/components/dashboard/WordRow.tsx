
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  categoryColorStyles,
  categoryStyles,
} from "@/data/vocabulary";
import { useVocabulary } from "@/contexts/VocabularyContext";

interface WordRowProps {
  word: string;
  meaning: string;
  category: string;
}

export function WordRow({
  word,
  meaning,
  category,
}: WordRowProps) {
  const { categories } = useVocabulary();
  const categoryColor = categories.find(
    (item) => item.name === category
  )?.color;

  return (
    <div className="border-b border-slate-100 px-4 py-4 last:border-none sm:px-6 sm:py-5">
      <div className="flex items-start justify-between gap-3 sm:items-center sm:gap-6">
        <div className="min-w-0 flex-1 sm:flex sm:items-center sm:gap-6">
          <p className="break-words font-semibold text-slate-900 sm:w-32 sm:shrink-0 lg:w-40">
            {word}
          </p>

          <p className="mt-1 break-words text-sm text-slate-500 sm:mt-0 sm:min-w-0 sm:flex-1">
            {meaning}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
              (categoryColor
                ? categoryColorStyles[categoryColor]
                : categoryStyles[category]) ??
              "bg-slate-100 text-slate-600"
            }`}
          >
            {category}
          </span>

          <Link
            href="/vocabulary"
            aria-label={`View ${word} in vocabulary`}
            className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}

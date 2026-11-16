"use client";

import { Pencil, Trash2 } from "lucide-react";

import {
  categorySolidColorStyles,
  categorySolidStyles,
  type VocabularyWord,
} from "@/data/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { VocabularyMasteryStatus } from "./VocabularyMasteryStatus";
import { VocabularyWordIdentity } from "./VocabularyWordIdentity";

interface VocabularyRowProps {
  item: VocabularyWord;
  categoryColor?: VocabularyCategoryRow["color"];
  selected: boolean;
  onToggleSelected: (id: string) => void;
  onToggleMastered: (id: string, currentStatus: VocabularyWord["status"]) => Promise<boolean>;
  onEdit: (word: VocabularyWord) => void;
  onDelete: (word: VocabularyWord) => void;
}

export function VocabularyRow({
  item,
  categoryColor,
  selected,
  onToggleSelected,
  onToggleMastered,
  onEdit,
  onDelete,
}: VocabularyRowProps) {
  return (
    <div className="vocabulary-word-row border-b border-slate-100 px-4 py-2 last:border-none sm:px-6 sm:py-2.5">
      <div className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-2 lg:grid-cols-[24px_minmax(0,1.2fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_36px] lg:items-center lg:gap-5">
        <div className="col-start-1 row-start-1 flex justify-center pt-1">
          <input
            type="checkbox"
            aria-label={`Select ${item.word}`}
            checked={selected}
            onChange={() => onToggleSelected(item.id)}
            className="size-4 cursor-pointer rounded border-slate-300 accent-blue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          />
        </div>

        <VocabularyWordIdentity item={item} />

        {/* Category and status share a compact row on mobile. */}
        <div className="col-start-2 row-start-2 flex min-w-0 items-center justify-between gap-3 lg:contents">
          <span
            className={`inline-flex w-max max-w-max justify-center rounded-full px-3 py-1 text-xs font-medium lg:col-start-4 lg:row-auto ${
              (categoryColor
                ? categorySolidColorStyles[categoryColor]
                : categorySolidStyles[item.category]) ??
              "bg-slate-600 text-white"
            }`}
          >
            {item.category}
          </span>

          {/* Status */}
          <VocabularyMasteryStatus
            item={item}
            onToggleMastered={onToggleMastered}
          />
        </div>

        {/* Actions */}
        <div className="vocabulary-row-actions relative col-start-3 row-start-1 justify-self-end lg:col-start-6 lg:row-auto">
          <ActionMenu label={item.word} actions={[
            { label: "Edit", icon: <Pencil size={15} />, onSelect: () => onEdit(item) },
            { label: "Remove", icon: <Trash2 size={15} />, onSelect: () => onDelete(item), destructive: true },
          ]} />
        </div>
      </div>
    </div>
  );
}


import type { RefObject } from "react";
import { SearchX } from "lucide-react";

import { Card } from "@/components/ui/Card";
import type { VocabularyWord } from "@/data/vocabulary";
import { VocabularyRow } from "./VocabularyRow";

interface VocabularyListProps {
  words: VocabularyWord[];
  isLoading: boolean;
  selectedIds: Set<string>;
  selectPageRef: RefObject<HTMLInputElement | null>;
  isPageSelected: boolean;
  isPagePartiallySelected: boolean;
  isBulkDeleting: boolean;
  onTogglePageSelection: () => void;
  onToggleSelected: (id: string) => void;
  onToggleMastered: (id: string, currentStatus: VocabularyWord["status"]) => Promise<boolean>;
  onEdit: (word: VocabularyWord) => void;
  onDelete: (word: VocabularyWord) => void;
}

export function VocabularyList({
  words,
  isLoading,
  selectedIds,
  selectPageRef,
  isPageSelected,
  isPagePartiallySelected,
  isBulkDeleting,
  onTogglePageSelection,
  onToggleSelected,
  onToggleMastered,
  onEdit,
  onDelete,
}: VocabularyListProps) {
  return (
    <Card className="mt-4 overflow-hidden border border-slate-100 bg-white shadow-sm">
      {/* Desktop table header */}

      <div className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-x-3 border-b border-slate-100 bg-sky-50/45 px-4 py-3 sm:px-6 lg:grid-cols-[24px_minmax(0,1.2fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_36px] lg:gap-5">
        <input
          ref={selectPageRef}
          type="checkbox"
          aria-label="Select all words on this page"
          aria-checked={isPagePartiallySelected ? "mixed" : isPageSelected}
          checked={isPageSelected}
          onChange={onTogglePageSelection}
          disabled={words.length === 0 || isBulkDeleting}
          className="col-start-1 row-start-1 size-4 cursor-pointer justify-self-center rounded border-slate-300 accent-blue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed"
        />
        <span className="sr-only col-start-2 row-start-1 text-xs font-semibold uppercase tracking-wide text-slate-400 lg:not-sr-only">
          Word
        </span>

        <span className="hidden text-xs font-semibold uppercase tracking-wide text-slate-400 lg:block">
          Meaning
        </span>

        <span className="hidden text-xs font-semibold uppercase tracking-wide text-slate-400 lg:block">
          Category
        </span>

        <span className="hidden text-xs font-semibold uppercase tracking-wide text-slate-400 lg:block">
          Status
        </span>

        <span className="hidden lg:block lg:col-start-6" aria-hidden="true" />
      </div>

      {words.length === 0 && isLoading ? (
        <div role="status" className="flex min-h-60 flex-col items-center justify-center gap-3 px-4 text-sm text-slate-500">
          <span className="size-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
          Loading vocabulary...
        </div>
      ) : words.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-4 py-12 text-center sm:px-6 sm:py-16">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <SearchX size={21} />
          </div>

          <h3 className="mt-4 font-semibold text-slate-900">
            No words found
          </h3>

          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Try changing your search or selecting another category.
          </p>
        </div>
      ) : (
        words.map((item) => (
          <VocabularyRow
            key={item.id}
            item={item}
            selected={selectedIds.has(item.id)}
            onToggleSelected={onToggleSelected}
            onToggleMastered={onToggleMastered}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))
      )}
    </Card>
  );
}

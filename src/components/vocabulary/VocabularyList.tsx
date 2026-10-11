import { SearchX } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { VocabularyWord } from "@/data/vocabulary";
import { VocabularyRow } from "./VocabularyRow";

interface VocabularyListProps {
  words: VocabularyWord[];
  onToggleMastered: (id: string) => void;
  onEdit: (word: VocabularyWord) => void;
  onDelete: (word: VocabularyWord) => void;
}

export function VocabularyList({
  words,
  onToggleMastered,
  onEdit,
  onDelete
}: VocabularyListProps) {
  return (
    <Card className="mt-5 overflow-hidden">
      <div className="grid grid-cols-[1.2fr_2fr_1fr_1fr_auto] gap-6 border-b border-slate-100 bg-slate-50/70 px-6 py-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Word
        </span>

        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Meaning
        </span>

        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Category
        </span>

        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Status
        </span>

        <span />
      </div>

      {words.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
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
            onToggleMastered={onToggleMastered}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))
        )}
    </Card>
  );
}
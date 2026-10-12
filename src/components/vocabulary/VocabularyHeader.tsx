
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/Button";

interface VocabularyHeaderProps {
  onAddWord: () => void;
}

export function VocabularyHeader({
  onAddWord,
}: VocabularyHeaderProps) {
  return (
    <header className="flex flex-col items-start gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium text-blue-600">
          Your collection
        </p>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Vocabulary
        </h1>

        <p className="mt-2 text-sm text-slate-500 sm:text-base">
          Keep track of the words you&apos;re learning.
        </p>
      </div>

      <Button
        onClick={onAddWord}
        className="w-full shrink-0 justify-center sm:w-auto"
      >
        <Plus size={17} />
        Add word
      </Button>
    </header>
  );
}


import { Plus, Tags } from "lucide-react";

import { Button } from "@/components/ui/Button";

interface VocabularyHeaderProps {
  onAddWord: () => void;
  onManageCategories: () => void;
}

export function VocabularyHeader({
  onAddWord,
  onManageCategories,
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

      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <Button
          variant="secondary"
          onClick={onManageCategories}
          className="w-full shrink-0 justify-center sm:w-auto"
        >
          <Tags size={17} />
          Categories
        </Button>
        <Button
          onClick={onAddWord}
          className="w-full shrink-0 justify-center sm:w-auto"
        >
          <Plus size={17} />
          Add word
        </Button>
      </div>
    </header>
  );
}

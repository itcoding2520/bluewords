import { Plus } from "lucide-react";

import { Button } from "@/components/ui/Button";

interface VocabularyHeaderProps {
  onAddWord: () => void;
}

export function VocabularyHeader({
  onAddWord,
}: VocabularyHeaderProps) {
  return (
    <header className="flex items-end justify-between">
      <div>
        <p className="text-sm font-medium text-blue-600">
          Your collection
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Vocabulary
        </h1>

        <p className="mt-2 text-slate-500">
          Keep track of the words you&apos;re learning.
        </p>
      </div>

      <Button onClick={onAddWord}>
        <Plus size={17} />
        Add word
      </Button>
    </header>
  );
}
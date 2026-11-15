import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button";

interface VocabularyBulkActionsProps {
  selectedCount: number;
  isDeleting: boolean;
  onDelete: () => void;
}

export function VocabularyBulkActions({
  selectedCount,
  isDeleting,
  onDelete,
}: VocabularyBulkActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
      <span aria-live="polite" className="text-sm font-medium text-slate-600">
        {selectedCount} selected
      </span>
      <Button
        variant="secondary"
        onClick={onDelete}
        disabled={isDeleting}
        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
      >
        <Trash2 size={16} />
        {isDeleting ? "Deleting..." : "Delete selected"}
      </Button>
    </div>
  );
}

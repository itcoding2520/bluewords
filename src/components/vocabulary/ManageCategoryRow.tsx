import { Pencil, Trash2 } from "lucide-react";
import { CategoryAvatar } from "@/components/vocabulary/CategoryAvatar";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";

export function ManageCategoryRow({
  category,
  colorClass,
  fallbackWordImagePath,
  isSaving,
  onEdit,
  onDelete,
}: {
  category: VocabularyCategoryRow;
  colorClass: string;
  fallbackWordImagePath?: string | null;
  isSaving: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <CategoryAvatar
        name={category.name}
        imagePath={category.image_path}
        fallbackWordImagePath={fallbackWordImagePath}
        colorClass={colorClass}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">{category.name}</p>
        {category.is_default && (
          <p className="text-xs text-slate-500">Default fallback category</p>
        )}
      </div>
      <button
        type="button"
        aria-label={`Edit ${category.name}`}
        onClick={onEdit}
        disabled={isSaving}
        className="flex size-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
      >
        <Pencil size={16} />
      </button>
      {!category.is_default && (
        <button
          type="button"
          aria-label={`Delete ${category.name}`}
          onClick={onDelete}
          disabled={isSaving}
          className="flex size-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}

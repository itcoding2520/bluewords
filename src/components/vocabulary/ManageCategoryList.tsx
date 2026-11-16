import { Check, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ManageCategoryRow } from "@/components/vocabulary/ManageCategoryRow";
import {
  VocabularyCategoryColorSelect,
  vocabularyCategoryColorOptions,
} from "@/components/vocabulary/VocabularyCategoryColorSelect";
import type { VocabularyWord } from "@/data/vocabulary";
import type {
  VocabularyCategoryRow,
} from "@/lib/supabase/categories";
import type { VocabularyCategoryColor } from "@/config/vocabulary";
import { normalizeVocabularyLabel } from "@/lib/vocabulary/normalize-text";
import { useCategoryFallbackWordImages } from "@/hooks/useCategoryFallbackWordImages";

interface ManageCategoryListProps {
  categories: VocabularyCategoryRow[];
  words: VocabularyWord[];
  editing: VocabularyCategoryRow | null;
  editName: string;
  editColor: VocabularyCategoryColor;
  isSaving: boolean;
  onEditNameChange: (name: string) => void;
  onEditColorChange: (color: VocabularyCategoryColor) => void;
  onStartEditing: (category: VocabularyCategoryRow) => void;
  onCancelEditing: () => void;
  onUpdate: (event: React.FormEvent<HTMLFormElement>) => void;
  onDelete: (category: VocabularyCategoryRow) => void;
}

export function ManageCategoryList({
  categories,
  words,
  editing,
  editName,
  editColor,
  isSaving,
  onEditNameChange,
  onEditColorChange,
  onStartEditing,
  onCancelEditing,
  onUpdate,
  onDelete,
}: ManageCategoryListProps) {
  const fallbackImagesByCategory = useCategoryFallbackWordImages(words);

  return (
    <div className="mt-5 space-y-2">
      {categories.map((category) => {
        const color = vocabularyCategoryColorOptions.find(
          (option) => option.value === category.color
        );

        return (
          <div
            key={category.id}
            className="rounded-xl border border-slate-200 p-3"
          >
            {editing?.id === category.id ? (
              <form
                onSubmit={onUpdate}
                className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_130px_auto]"
              >
                <Input
                  aria-label="Category name"
                  value={editName}
                  onChange={(event) => onEditNameChange(event.target.value)}
                  disabled={category.is_default}
                  maxLength={50}
                />
                <VocabularyCategoryColorSelect
                  ariaLabel="Category color"
                  value={editColor}
                  onChange={onEditColorChange}
                />
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    aria-label={`Save ${category.name}`}
                    disabled={!editName.trim() || isSaving}
                    className="size-11 px-0"
                  >
                    <Check size={16} />
                  </Button>
                  <Button
                    variant="secondary"
                    aria-label="Cancel editing"
                    onClick={onCancelEditing}
                    disabled={isSaving}
                    className="size-11 px-0"
                  >
                    <X size={16} />
                  </Button>
                </div>
              </form>
            ) : (
              <ManageCategoryRow
                category={category}
                colorClass={color?.className ?? "bg-slate-300"}
                fallbackWordImagePath={fallbackImagesByCategory.get(normalizeVocabularyLabel(category.name))}
                isSaving={isSaving}
                onEdit={() => onStartEditing(category)}
                onDelete={() => onDelete(category)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

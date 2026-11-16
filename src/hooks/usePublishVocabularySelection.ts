import { useMemo, useState } from "react";
import type { VocabularyWord } from "@/data/vocabulary";
import { groupBy } from "@/lib/group-by";
import { normalizeVocabularyText } from "@/lib/vocabulary/normalize-text";

type PublishableWord = Pick<VocabularyWord, "id" | "category">;

export function usePublishVocabularySelection(userWords: PublishableWord[]) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);
  const wordsByCategory = useMemo(
    () => groupBy(userWords, (word) => normalizeVocabularyText(word.category)),
    [userWords],
  );

  function toggleCategoryRequest(categoryName: string, checked: boolean) {
    const normalizedName = normalizeVocabularyText(categoryName);
    setSelectedCategories((current) => checked
      ? current.includes(categoryName) ? current : [...current, categoryName]
      : current.filter((name) => name !== categoryName));
    const categoryWordIds = (wordsByCategory.get(normalizedName) ?? [])
      .map((word) => word.id);
    const categoryWordIdSet = new Set(categoryWordIds);
    setSelectedWordIds((current) => checked
      ? [...new Set([...current, ...categoryWordIds])]
      : current.filter((id) => !categoryWordIdSet.has(id)));
  }

  return {
    selectedCategories,
    selectedWordIds,
    setSelectedWordIds,
    setSelectedCategories,
    toggleCategoryRequest,
  };
}

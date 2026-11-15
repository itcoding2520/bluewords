import { useState } from "react";
import type { VocabularyWord } from "@/data/vocabulary";
import { normalize } from "@/lib/vocabulary/publish-options";

type PublishableWord = Pick<VocabularyWord, "id" | "category">;

export function usePublishVocabularySelection(userWords: PublishableWord[]) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);

  function toggleCategoryRequest(categoryName: string, checked: boolean) {
    const normalizedName = normalize(categoryName);
    setSelectedCategories((current) => checked
      ? current.includes(categoryName) ? current : [...current, categoryName]
      : current.filter((name) => name !== categoryName));
    const categoryWordIds = userWords
      .filter((word) => normalize(word.category) === normalizedName)
      .map((word) => word.id);
    setSelectedWordIds((current) => checked
      ? [...new Set([...current, ...categoryWordIds])]
      : current.filter((id) => !categoryWordIds.includes(id)));
  }

  return {
    selectedCategories,
    selectedWordIds,
    setSelectedWordIds,
    setSelectedCategories,
    toggleCategoryRequest,
  };
}

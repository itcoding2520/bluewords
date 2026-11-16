import { useMemo } from "react";
import type { VocabularyWord } from "@/data/vocabulary";
import { normalizeVocabularyLabel } from "@/lib/vocabulary/normalize-text";

export function useCategoryFallbackWordImages(words: VocabularyWord[]) {
  return useMemo(() => {
    const images = new Map<string, string>();
    for (const word of words) {
      if (!word.imagePath) continue;
      const key = normalizeVocabularyLabel(word.category);
      if (!images.has(key)) images.set(key, word.imagePath);
    }
    return images;
  }, [words]);
}

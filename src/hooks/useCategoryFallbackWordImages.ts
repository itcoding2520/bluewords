import { useMemo } from "react";
import type { VocabularyWord } from "@/data/vocabulary";
import { normalizeVocabularyLabel } from "@/lib/vocabulary/normalize-text";
import { getFirstImageByKey } from "@/lib/vocabulary/first-image-by-key";

export function useCategoryFallbackWordImages(words: VocabularyWord[]) {
  return useMemo(() => {
    return getFirstImageByKey(words.map((word) => ({
      key: normalizeVocabularyLabel(word.category),
      imagePath: word.imagePath,
    })));
  }, [words]);
}

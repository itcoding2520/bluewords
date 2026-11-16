import { useState } from "react";
import type { VocabularyMeaning } from "@/data/vocabulary";
import { PARTS_OF_SPEECH } from "@/config/vocabulary";

export function useVocabularyDetailedMeanings(initialMeanings: VocabularyMeaning[]) {
  const [detailedMeanings, setDetailedMeanings] = useState(initialMeanings);

  function updateDetailedMeaning(index: number, updates: Partial<VocabularyMeaning>) {
    setDetailedMeanings((current) => current.map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...updates } : item
    ));
  }

  function addDetailedMeaning() {
    setDetailedMeanings((current) => [
      ...current,
      { partOfSpeech: PARTS_OF_SPEECH[0], meaning: "" },
    ]);
  }

  function removeDetailedMeaning(index: number) {
    setDetailedMeanings((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  return { detailedMeanings, updateDetailedMeaning, addDetailedMeaning, removeDetailedMeaning };
}

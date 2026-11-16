import type { VocabularyWord } from "@/data/vocabulary";

export function getDetailedVocabularyMeanings(word: VocabularyWord) {
  return (word.detailedMeanings ?? []).filter(
    (meaning) => typeof meaning.meaning === "string" && meaning.meaning.trim(),
  );
}

export function getPrimaryVocabularyMeaning(word: VocabularyWord): string {
  return word.detailedMeanings?.find((item) => item.meaning.trim())?.meaning.trim()
    || word.meaning.trim();
}

export function getWordSearchMeaning(word: VocabularyWord | undefined): string {
  return word?.meaning?.trim()
    || word?.detailedMeanings?.find((item) => item.meaning.trim())?.meaning
    || "Meaning unavailable";
}

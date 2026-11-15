import type { VocabularyWord } from "@/data/vocabulary";

export function getPrimaryVocabularyMeaning(word: VocabularyWord): string {
  return word.detailedMeanings?.find((item) => item.meaning.trim())?.meaning.trim()
    || word.meaning.trim();
}

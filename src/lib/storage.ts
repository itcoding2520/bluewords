import type { VocabularyWord } from "@/data/vocabulary";

const STORAGE_KEY = "bluewords-vocabulary";

export function loadVocabulary(): VocabularyWord[] | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return null;
    }

    return JSON.parse(stored) as VocabularyWord[];
  } catch {
    return null;
  }
}

export function saveVocabulary(
  words: VocabularyWord[]
) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(words)
    );
  } catch {
    // Storage may be unavailable or full.
  }
}
import type { VocabularyStatus, VocabularyWord } from "@/data/vocabulary";
import { matchesVocabularyCategory } from "@/lib/vocabulary/category-filter";

export interface Flashcard {
  word: VocabularyWord;
}

export function filterFlashcardWords(
  words: VocabularyWord[],
  category: string,
  status?: VocabularyStatus,
): VocabularyWord[] {
  return words.filter((word) =>
    matchesVocabularyCategory(word.category, category)
    && (status === undefined || word.status === status)
  );
}

export function shuffleDeck(deck: Flashcard[], seed: number): Flashcard[] {
  const shuffled = [...deck];
  let state = seed || 1;

  function random() {
    state = (state + 0x6d2b79f5) | 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }

  return shuffled;
}

export function buildFlashcardDeck(words: VocabularyWord[]): Flashcard[] {
  return words.map((word) => ({ word }));
}

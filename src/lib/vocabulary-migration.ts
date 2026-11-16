
import type { VocabularyWord } from "@/data/vocabulary";
import { VOCABULARY_CATEGORIES } from "@/config/vocabulary";
import { loadVocabulary } from "@/lib/storage";
import { isLearningStatus } from "@/types/learning";

function isVocabularyWord(value: unknown): value is VocabularyWord {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const word = value as Record<string, unknown>;

  return (
    typeof word.id === "string" &&
    typeof word.word === "string" &&
    word.word.trim().length > 0 &&
    typeof word.meaning === "string" &&
    word.meaning.trim().length > 0 &&
    VOCABULARY_CATEGORIES.some((category) => category === word.category) &&
    isLearningStatus(word.status)
  );
}

export function getLegacyVocabulary(): VocabularyWord[] {
  const stored = loadVocabulary();

  if (!Array.isArray(stored)) {
    return [];
  }

  return stored.filter(isVocabularyWord);
}

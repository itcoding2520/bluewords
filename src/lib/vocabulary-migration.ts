
import type { VocabularyWord } from "@/data/vocabulary";
import { loadVocabulary } from "@/lib/storage";

const CATEGORIES = ["Daily", "Work", "Frontend"] as const;
const STATUSES = ["learning", "mastered"] as const;

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
    CATEGORIES.includes(
      word.category as (typeof CATEGORIES)[number]
    ) &&
    STATUSES.includes(
      word.status as (typeof STATUSES)[number]
    )
  );
}

export function getLegacyVocabulary(): VocabularyWord[] {
  const stored = loadVocabulary();

  if (!Array.isArray(stored)) {
    return [];
  }

  return stored.filter(isVocabularyWord);
}

export const VOCABULARY_CATEGORIES = [
  "Daily",
  "Work",
  "Frontend",
] as const;

export type VocabularyCategory =
  (typeof VOCABULARY_CATEGORIES)[number];
export const VOCABULARY_CATEGORIES = [
  "Daily",
  "Work",
  "Frontend",
] as const;

export type VocabularyCategory = string;

export const VOCABULARY_CATEGORY_COLORS = [
  "blue",
  "violet",
  "orange",
  "green",
  "rose",
  "indigo",
  "teal",
  "amber",
  "pink",
  "slate",
] as const;

export type VocabularyCategoryColor = (typeof VOCABULARY_CATEGORY_COLORS)[number];

export function isVocabularyCategoryColor(value: unknown): value is VocabularyCategoryColor {
  return typeof value === "string" && VOCABULARY_CATEGORY_COLORS.some((color) => color === value);
}

export const VOCABULARY_TYPES = [
  "word",
  "expression",
] as const;

export type VocabularyType =
  (typeof VOCABULARY_TYPES)[number];

export function isVocabularyType(value: unknown): value is VocabularyType {
  return typeof value === "string" && VOCABULARY_TYPES.some((type) => type === value);
}

export const PARTS_OF_SPEECH = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "pronoun",
  "preposition",
  "conjunction",
  "interjection",
  "determiner",
  "auxiliary verb",
] as const;

export type PartOfSpeech =
  (typeof PARTS_OF_SPEECH)[number];

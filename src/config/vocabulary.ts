export const VOCABULARY_CATEGORIES = [
  "Daily",
  "Work",
  "Frontend",
] as const;

export type VocabularyCategory =
  (typeof VOCABULARY_CATEGORIES)[number];

export const VOCABULARY_TYPES = [
  "word",
  "expression",
] as const;

export type VocabularyType =
  (typeof VOCABULARY_TYPES)[number];

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
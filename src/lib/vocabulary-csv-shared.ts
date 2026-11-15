import type { VocabularyWord } from "@/data/vocabulary";

export const MAX_VOCABULARY_IMPORT_WORDS = 50;

export const VOCABULARY_CSV_HEADERS = [
  "word",
  "type",
  "meaning",
  "part_of_speech",
  "detailed_meaning",
  "category",
  "status",
  "ipa",
] as const;

export function normalizeVocabularyCsvValue(value: string): string {
  return value.trim().toLowerCase();
}

export type VocabularyCsvWord = Omit<VocabularyWord, "id">;

export interface VocabularyCsvIssue {
  line: number;
  message: string;
}

export interface VocabularyCsvPreview {
  items: VocabularyCsvWord[];
  errors: VocabularyCsvIssue[];
  duplicates: number;
  categoryFallbacks: number;
  totalRows: number;
}

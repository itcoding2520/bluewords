import type {
  VocabularyMeaningRow,
  VocabularyWordRow,
} from "@/types/database";

export type VocabularyWordWithMeaningsRow = VocabularyWordRow & {
  vocabulary_meanings: VocabularyMeaningRow[];
};

export interface VocabularyWordPage {
  rows: VocabularyWordWithMeaningsRow[];
  total: number;
}

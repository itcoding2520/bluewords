import type {
  PartOfSpeech,
  VocabularyType,
} from "@/config/vocabulary";

export type VocabularyWordRow = {
  id: string;
  user_id: string;
  word: string;
  meaning: string;
  category: "Daily" | "Work" | "Frontend";
  status: "learning" | "mastered";
  type: VocabularyType;
  image_path: string | null;
  created_at: string;
  updated_at: string;
};

export type VocabularyWordInsert = {
  user_id: string;
  word: string;
  meaning: string;
  category: VocabularyWordRow["category"];
  status?: VocabularyWordRow["status"];
  type?: VocabularyType;
  image_path?: string | null;
};

export type VocabularyWordUpdate = Partial<
  Pick<
    VocabularyWordRow,
    "word" | "meaning" | "category" | "status" | "type" | "image_path"
  >
>;

export type VocabularyMeaningRow = {
  id: string;
  vocabulary_word_id: string;
  part_of_speech: PartOfSpeech;
  meaning: string;
  created_at: string;
};

export type VocabularyMeaningInsert = {
  vocabulary_word_id: string;
  part_of_speech: PartOfSpeech;
  meaning: string;
};

export type VocabularyMeaningUpdate = Partial<
  Pick<VocabularyMeaningRow, "part_of_speech" | "meaning">
>;
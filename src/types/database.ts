import type {
  PartOfSpeech,
} from "@/config/vocabulary";

export type VocabularyWordRow = {
  id: string;
  user_id: string;
  word: string;
  meaning: string;
  category: string;
  type: "word" | "expression";
  image_path: string | null;
  status: "learning" | "mastered";
  created_at: string;
  updated_at: string;
};

export type VocabularyWordInsert = {
  user_id: string;
  word: string;
  meaning: string;
  category: VocabularyWordRow["category"];
  type?: VocabularyWordRow["type"];
  image_path?: VocabularyWordRow["image_path"];
  status?: VocabularyWordRow["status"];
};

export type VocabularyWordUpdate = Partial<
  Pick<
    VocabularyWordRow,
    "word" | "meaning" | "category" | "type" | "image_path" | "status"
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
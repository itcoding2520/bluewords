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
  ipa: string | null;
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
  ipa?: VocabularyWordRow["ipa"];
  image_path?: VocabularyWordRow["image_path"];
  status?: VocabularyWordRow["status"];
};

export type VocabularyWordUpdate = Partial<
  Pick<
    VocabularyWordRow,
    "word" | "meaning" | "category" | "type" | "ipa" | "image_path" | "status"
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

export type VocabularyReviewRow = {
  id: string;
  user_id: string;
  vocabulary_word_id: string;
  remembered: boolean;
  reviewed_at: string;
};

export type VocabularyReviewInsert = Pick<
  VocabularyReviewRow,
  "user_id" | "vocabulary_word_id" | "remembered"
>;

export type VocabularyReviewScheduleRow = {
  user_id: string;
  vocabulary_word_id: string;
  due_at: string;
  interval_days: number;
  repetitions: number;
  last_reviewed_at: string | null;
  updated_at: string;
};

export type VocabularyReviewScheduleUpsert = Pick<
  VocabularyReviewScheduleRow,
  "user_id" | "vocabulary_word_id" | "due_at" | "interval_days" | "repetitions" | "last_reviewed_at"
>;

export type VocabularyQuizMode = "type-word" | "choose-meaning";

export type VocabularyQuizSessionRow = {
  id: string;
  user_id: string;
  mode: VocabularyQuizMode;
  question_count: number;
  correct_count: number;
  duration_seconds: number;
  started_at: string;
  completed_at: string;
  created_at: string;
};

export type VocabularyQuizAnswerRow = {
  id: string;
  session_id: string;
  user_id: string;
  vocabulary_word_id: string | null;
  question_position: number;
  prompt_type: VocabularyQuizMode;
  word_text: string;
  prompt_text: string;
  expected_answer: string;
  selected_answer: string;
  is_correct: boolean;
  part_of_speech: string | null;
  choices: string[];
  image_path: string | null;
  created_at: string;
};

export type VocabularyQuizAnswerInsert = Omit<
  VocabularyQuizAnswerRow,
  "id" | "session_id" | "user_id" | "created_at" | "prompt_type"
>;

export type WordSearchDifficulty = "easy" | "medium" | "hard";

export type WordSearchSessionRow = {
  id: string;
  user_id: string;
  grid_size: 10 | 15 | 20 | 30;
  difficulty: WordSearchDifficulty;
  category: string;
  word_count: number;
  duration_seconds: number;
  words: string[];
  started_at: string;
  completed_at: string;
  created_at: string;
};

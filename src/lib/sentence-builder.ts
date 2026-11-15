export type SentenceDifficulty = "easy" | "medium" | "hard";

export type SentenceBuilderQuestion = {
  id: string;
  question_id: string;
  difficulty: SentenceDifficulty;
  category: string;
  prompt_vi: string;
  answer_sentence: string;
  answer_tokens: string[];
  distractor_tokens: string[];
  image_keyword: string;
  vocabulary_words: string[];
  is_active: boolean;
};

export type SentenceQuestionInput = Omit<SentenceBuilderQuestion, "id">;

export type Lesson = {
  id: string;
  topic_id: string;
  title_en: string;
  title_vi: string;
  difficulty: "easy" | "medium" | "hard";
  status: string;
};

export type Topic = {
  id: string;
  title_en: string;
  title_vi: string;
};

export type Item = {
  id: string;
  item_key: string;
  item_type: "word" | "phrase" | "sentence_pattern";
  content_en: string;
  meaning_vi: string;
  example_en: string;
  example_vi: string;
  image_keyword: string;
  audio_url: string;
  sort_order: number;
};

export type Dialogue = {
  id: string;
  title_en: string;
  title_vi: string;
  prompt_vi: string;
  sort_order: number;
};

export type Turn = {
  id: string;
  speaker: string;
  text_en: string;
  meaning_vi: string;
  audio_url: string;
  response_prompt_vi: string;
  expected_response: string;
  response_options: string[];
  turn_order: number;
};

export type ItemReview = {
  status: "learning" | "mastered";
  review_count: number;
  correct_count: number;
};

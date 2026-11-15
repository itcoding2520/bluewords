export type AssessmentQuestion =
  | { type: "vocabulary"; prompt: string; word: string; meaning: string; category: string; imagePath: string | null; imageUrl?: string | null; choices: string[]; answer: string }
  | { type: "sentence"; prompt: string; category: string; imageKeyword: string; tiles: string[]; answer: string };

export type AssessmentQuestionForLearner =
  | Omit<Extract<AssessmentQuestion, { type: "vocabulary" }>, "answer">
  | Omit<Extract<AssessmentQuestion, { type: "sentence" }>, "answer">;

export type AssessmentReviewQuestion = {
  type: "vocabulary" | "sentence";
  prompt: string;
  answer: string;
  word?: string;
  meaning?: string;
};

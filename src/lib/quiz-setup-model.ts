import type { VocabularyWord } from "@/data/vocabulary";
import { buildVocabularyGameCategoryOptions, type VocabularyGameCategoryOption } from "@/lib/vocabulary/game-category-options";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import type { QuizQuestion } from "@/lib/quiz-model";
import { normalizeQuizAnswer } from "@/lib/supabase/normalize-quiz-answer.mjs";
import { sampleRandom, shuffle } from "@/lib/quiz-random";

export type QuizCategoryOption = VocabularyGameCategoryOption;

export function buildQuizCategoryOptions(
  categories: VocabularyCategoryRow[],
  words: VocabularyWord[]
): QuizCategoryOption[] {
  return buildVocabularyGameCategoryOptions(categories, words, true);
}

export function buildQuizPreviewQuestion(questions: QuizQuestion[]): QuizQuestion | undefined {
  const previewBase = questions.find((question) => question.word.word.toLocaleLowerCase() === "doctor" && question.word.imagePath)
    ?? questions.find((question) => question.choiceType === "meaning" && question.word.imagePath)
    ?? questions[0];
  if (!previewBase) return undefined;

  const normalizedPreviewMeaning = normalizeQuizAnswer(previewBase.meaning);
  const distractors = sampleRandom([...new Map(questions
    .map((question) => question.meaning)
    .filter((meaning) => normalizeQuizAnswer(meaning) !== normalizedPreviewMeaning)
    .map((meaning) => [normalizeQuizAnswer(meaning), meaning] as const)).values()], 3);
  if (distractors.length < 3) return previewBase;
  return {
    ...previewBase,
    choiceType: "meaning",
    correctAnswer: previewBase.meaning,
    choices: shuffle([previewBase.meaning, ...distractors]),
  };
}

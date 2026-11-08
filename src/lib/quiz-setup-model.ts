import type { VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCategoryColor, VocabularyCategoryRow } from "@/lib/supabase/categories";
import type { QuizQuestion } from "@/lib/quiz-model";
import { normalizeQuizAnswer } from "@/lib/supabase/normalize-quiz-answer.mjs";
import { sampleRandom, shuffle } from "@/lib/quiz-random";

export type QuizCategoryOption = {
  id: string;
  name: string;
  value: string;
  color: VocabularyCategoryColor;
  imagePath: string | null;
};

export function buildQuizCategoryOptions(
  categories: VocabularyCategoryRow[],
  words: VocabularyWord[]
): QuizCategoryOption[] {
  let firstWordImage: string | null = null;
  const wordImagesByCategory = new Map<string, string>();
  for (const word of words) {
    if (!word.imagePath) continue;
    firstWordImage ??= word.imagePath;
    if (word.category && !wordImagesByCategory.has(word.category)) {
      wordImagesByCategory.set(word.category, word.imagePath);
    }
  }
  const visibleCategories = categories.filter((item) => item.name.trim().toLowerCase() !== "uncategorized");
  return [
    { id: "all-categories", name: "All categories", value: "all", color: "blue", imagePath: firstWordImage },
    ...visibleCategories.map((item) => ({
      id: item.id,
      name: item.name,
      value: item.name,
      color: item.color,
      imagePath: item.image_path
        ? `category:${item.image_path}`
        : wordImagesByCategory.get(item.name) ?? null,
    })),
  ];
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

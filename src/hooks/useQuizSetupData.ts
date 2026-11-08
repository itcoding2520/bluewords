import { useMemo } from "react";

import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import type { VocabularyWord } from "@/data/vocabulary";
import { filterQuizWordsByCategory } from "@/lib/quiz-category-filter.mjs";
import { buildMeaningQuestions } from "@/lib/quiz-question-generator";
import { buildQuizCategoryOptions, buildQuizPreviewQuestion } from "@/lib/quiz-setup-model";
import type { QuizMode } from "@/lib/quiz-model";

export function useQuizSetupData({
  words,
  categories,
  category,
  mode,
}: {
  words: VocabularyWord[];
  categories: VocabularyCategoryRow[];
  category: string;
  mode: QuizMode;
}) {
  const categoryWords = useMemo(
    () => filterQuizWordsByCategory(words, category),
    [category, words]
  );
  const categoryOptions = useMemo(() => buildQuizCategoryOptions(categories, words), [categories, words]);
  const meaningQuestions = useMemo(() => buildMeaningQuestions(categoryWords), [categoryWords]);
  const previewMeaningQuestion = useMemo(() => buildQuizPreviewQuestion(meaningQuestions), [meaningQuestions]);
  const eligibleWords = useMemo(
    () => mode === "type-word" ? categoryWords.filter((word) => Boolean(word.imagePath)) : meaningQuestions.map((question) => question.word),
    [categoryWords, mode, meaningQuestions]
  );

  return {
    categoryWords,
    categoryOptions,
    meaningQuestions,
    previewMeaningQuestion,
    typeWordCount: categoryWords.filter((word) => Boolean(word.imagePath)).length,
    eligibleWords,
    maximumQuestions: eligibleWords.length,
  };
}

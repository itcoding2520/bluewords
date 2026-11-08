import { useMemo } from "react";

import type { VocabularyCategoryColor } from "@/lib/supabase/categories";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import type { VocabularyWord } from "@/data/vocabulary";
import { filterQuizWordsByCategory } from "@/lib/quiz-category-filter.mjs";
import { buildMeaningQuestions, sampleRandom, shuffle } from "@/lib/quiz-model";
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
  const categoryOptions = useMemo(() => {
    const visibleCategories = categories.filter((item) => item.name.trim().toLowerCase() !== "uncategorized");
    return [
      { id: "all-categories", name: "All categories", value: "all", color: "blue" as VocabularyCategoryColor, imagePath: words.find((word) => word.imagePath)?.imagePath ?? null },
      ...visibleCategories.map((item) => ({
        id: item.id,
        name: item.name,
        value: item.name,
        color: item.color,
        imagePath: item.image_path ? `category:${item.image_path}` : words.find((word) => word.category === item.name && word.imagePath)?.imagePath ?? null,
      })),
    ];
  }, [categories, words]);
  const meaningQuestions = useMemo(() => buildMeaningQuestions(categoryWords), [categoryWords]);
  const previewMeaningQuestion = useMemo(() => {
    const previewBase = meaningQuestions.find((question) => question.word.word.toLocaleLowerCase() === "doctor" && question.word.imagePath)
      ?? meaningQuestions.find((question) => question.choiceType === "meaning" && question.word.imagePath)
      ?? meaningQuestions[0];
    if (!previewBase) return undefined;

    const distractors = sampleRandom([...new Set(meaningQuestions
      .map((question) => question.meaning)
      .filter((meaning) => meaning.toLocaleLowerCase() !== previewBase.meaning.toLocaleLowerCase()))], 3);
    if (distractors.length < 3) return previewBase;
    return {
      ...previewBase,
      choiceType: "meaning" as const,
      correctAnswer: previewBase.meaning,
      choices: shuffle([previewBase.meaning, ...distractors]),
    };
  }, [meaningQuestions]);
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

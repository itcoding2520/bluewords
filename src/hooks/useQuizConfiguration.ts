"use client";

import { useState } from "react";

import { QUIZ_QUESTION_COUNTS, type QuizMode } from "@/lib/quiz-model";

export function useQuizConfiguration() {
  const [mode, setMode] = useState<QuizMode>("choose-meaning");
  const [category, setCategory] = useState("all");
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [questionCount, setQuestionCount] = useState<number>(QUIZ_QUESTION_COUNTS[0]);

  return {
    mode,
    setMode,
    category,
    setCategory,
    categoriesExpanded,
    setCategoriesExpanded,
    questionCount,
    setQuestionCount,
  };
}

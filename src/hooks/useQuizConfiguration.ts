"use client";

import { useState } from "react";

import type { QuizMode } from "@/lib/quiz-model";

export function useQuizConfiguration() {
  const [mode, setMode] = useState<QuizMode>("choose-meaning");
  const [category, setCategory] = useState("all");
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [questionCount, setQuestionCount] = useState(10);

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

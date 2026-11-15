import { useState } from "react";
import type { AssessmentQuestionForLearner } from "@/lib/assessments/types";

export function useAssessmentRunnerAnswers(questions: AssessmentQuestionForLearner[]) {
  const [answers, setAnswers] = useState<string[]>(Array(10).fill(""));
  const [sentenceTiles, setSentenceTiles] = useState<number[][]>(
    Array.from({ length: 10 }, () => [])
  );

  function setAnswer(index: number, value: string) {
    setAnswers((previous) => previous.map((answer, position) => position === index ? value : answer));
  }

  function toggleSentenceTile(questionIndex: number, tileIndex: number) {
    const question = questions[questionIndex];
    if (question?.type !== "sentence") return;
    setSentenceTiles((previous) => {
      const next = previous.map((entry) => [...entry]);
      const currentSelection = next[questionIndex];
      if (currentSelection.includes(tileIndex)) next[questionIndex] = currentSelection.filter((entry) => entry !== tileIndex);
      else if (currentSelection.length < (question.tiles?.length ?? 0)) next[questionIndex] = [...currentSelection, tileIndex];
      const result = next[questionIndex].map((entry) => question.tiles?.[entry] ?? "").join(" ").replace(/\s+([.,!?])/g, "$1");
      setAnswers((old) => old.map((answer, position) => position === questionIndex ? result : answer));
      return next;
    });
  }

  function clearSentence(questionIndex: number) {
    setSentenceTiles((all) => all.map((entry, index) => index === questionIndex ? [] : entry));
    setAnswer(questionIndex, "");
  }

  return { answers, setAnswers, sentenceTiles, setAnswer, toggleSentenceTile, clearSentence };
}

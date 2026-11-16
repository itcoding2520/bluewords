import { useCallback, useState, type Dispatch, type SetStateAction } from "react";
import type { AssessmentQuestionForLearner } from "@/lib/assessments/types";
import { resolveStateAction } from "@/lib/state-action";

interface AssessmentAnswersState {
  answers: string[];
  sentenceTiles: number[][];
}

const initialState: AssessmentAnswersState = {
  answers: Array(10).fill(""),
  sentenceTiles: Array.from({ length: 10 }, () => []),
};

export function useAssessmentRunnerAnswers(questions: AssessmentQuestionForLearner[]) {
  const [state, setState] = useState(initialState);

  const setAnswers = useCallback<Dispatch<SetStateAction<string[]>>>((action) => {
    setState((current) => ({
      ...current,
      answers: resolveStateAction(current.answers, action),
    }));
  }, []);

  function setAnswer(index: number, value: string) {
    setState((current) => ({
      ...current,
      answers: current.answers.map((answer, position) => position === index ? value : answer),
    }));
  }

  function toggleSentenceTile(questionIndex: number, tileIndex: number) {
    const question = questions[questionIndex];
    if (question?.type !== "sentence") return;
    setState((current) => {
      const next = current.sentenceTiles.map((entry) => [...entry]);
      const currentSelection = next[questionIndex];
      if (currentSelection.includes(tileIndex)) next[questionIndex] = currentSelection.filter((entry) => entry !== tileIndex);
      else if (currentSelection.length < (question.tiles?.length ?? 0)) next[questionIndex] = [...currentSelection, tileIndex];
      const result = next[questionIndex].map((entry) => question.tiles?.[entry] ?? "").join(" ").replace(/\s+([.,!?])/g, "$1");
      return {
        sentenceTiles: next,
        answers: current.answers.map((answer, position) => position === questionIndex ? result : answer),
      };
    });
  }

  function clearSentence(questionIndex: number) {
    setState((current) => ({
      sentenceTiles: current.sentenceTiles.map((entry, index) => index === questionIndex ? [] : entry),
      answers: current.answers.map((answer, index) => index === questionIndex ? "" : answer),
    }));
  }

  return {
    answers: state.answers,
    setAnswers,
    sentenceTiles: state.sentenceTiles,
    setAnswer,
    toggleSentenceTile,
    clearSentence,
  };
}

import { useState } from "react";
import type { AssessmentQuestionForLearner } from "@/lib/assessments/types";
import { ASSESSMENT_QUESTION_COUNT } from "@/lib/assessments/constants";
import { toggleSentenceAnswerTile } from "@/lib/assessments/sentence-tile-answer";
import { useStateField } from "@/hooks/useStateField";

interface AssessmentAnswersState {
  answers: string[];
  sentenceTiles: number[][];
}

const initialState: AssessmentAnswersState = {
  answers: Array(ASSESSMENT_QUESTION_COUNT).fill(""),
  sentenceTiles: Array.from({ length: ASSESSMENT_QUESTION_COUNT }, () => []),
};

export function useAssessmentRunnerAnswers(questions: AssessmentQuestionForLearner[]) {
  const [state, setState] = useState(initialState);

  const setAnswers = useStateField(setState, "answers");

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
      const answer = toggleSentenceAnswerTile(question, currentSelection, tileIndex);
      next[questionIndex] = answer.tileIndexes;
      return {
        sentenceTiles: next,
        answers: current.answers.map((value, position) => position === questionIndex ? answer.answer : value),
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

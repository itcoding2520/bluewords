"use client";

import { Star, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { expectedAnswer } from "@/lib/quiz-answer-model";
import { getQuizAdvanceLabel, type QuizAnswer, type QuizMode, type QuizQuestion } from "@/lib/quiz-model";

export function QuizAnswerFeedback({
  answer,
  question,
  mode,
  questionIndex,
  questionCount,
  onNext,
}: {
  answer: QuizAnswer;
  question: QuizQuestion;
  mode: QuizMode;
  questionIndex: number;
  questionCount: number;
  onNext: () => void;
}) {
  return (
    <div className="quiz-game-feedback mt-5 flex w-full max-w-3xl flex-col items-center gap-3" role="status">
      {answer.correct ? (
        <p className="quiz-correct-feedback"><Star size={24} fill="currentColor" /> Correct! <span>Great job! 🎉</span></p>
      ) : (
        <AutoDismissMessage key={`${questionIndex}:${answer.value}`} variant="error" className="inline-flex items-center gap-2 bg-transparent p-0 font-semibold">
          <X size={17} />{`The answer is: ${expectedAnswer(question, mode)}`}
        </AutoDismissMessage>
      )}
      <Button onClick={onNext} className="hidden sm:inline-flex">
        {getQuizAdvanceLabel(questionIndex, questionCount)}
      </Button>
    </div>
  );
}

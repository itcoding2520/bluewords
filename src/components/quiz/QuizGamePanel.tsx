"use client";

import { Card } from "@/components/ui/Card";
import { QuizAnswerFeedback } from "@/components/quiz/QuizAnswerFeedback";
import { QuizChoiceQuestion } from "@/components/quiz/QuizChoiceQuestion";
import { QuizGameStatusBar } from "@/components/quiz/QuizGameStatusBar";
import { QuizTypeWordQuestion } from "@/components/quiz/QuizTypeWordQuestion";
import type { QuizAnswer, QuizMode, QuizQuestion } from "@/lib/quiz-model";

export function QuizGamePanel({
  question,
  mode,
  questionIndex,
  questionCount,
  answer,
  input,
  elapsedSeconds,
  onExit,
  onInputChange,
  onSubmitAnswer,
  onNext,
}: {
  question: QuizQuestion;
  mode: QuizMode;
  questionIndex: number;
  questionCount: number;
  answer: QuizAnswer | undefined;
  input: string;
  elapsedSeconds: number;
  onExit: () => void;
  onInputChange: (input: string) => void;
  onSubmitAnswer: (answer: string) => void;
  onNext: () => void;
}) {
  return (
    <Card className="quiz-game-card mx-auto max-w-5xl p-5 sm:p-8">
      <QuizGameStatusBar questionIndex={questionIndex} questionCount={questionCount} elapsedSeconds={elapsedSeconds} onExit={onExit} />
      <div className="quiz-game-prompt flex md:min-h-[360px] flex-col items-center justify-center pt-3 text-center sm:pt-6">
        {mode === "type-word" ? (
          <QuizTypeWordQuestion word={question.word} answer={answer} input={input} onInputChange={onInputChange} onSubmitAnswer={onSubmitAnswer} />
        ) : (
          <QuizChoiceQuestion question={question} mode={mode} answer={answer} onSubmitAnswer={onSubmitAnswer} />
        )}
        {answer && <QuizAnswerFeedback answer={answer} question={question} mode={mode} questionIndex={questionIndex} questionCount={questionCount} onNext={onNext} />}
      </div>
    </Card>
  );
}

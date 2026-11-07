"use client";

import { ArrowLeft, Clock3 } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { QuizAnswerFeedback } from "@/components/quiz/QuizAnswerFeedback";
import { QuizChoiceQuestion } from "@/components/quiz/QuizChoiceQuestion";
import { QuizTypeWordQuestion } from "@/components/quiz/QuizTypeWordQuestion";
import { formatQuizTime, type QuizAnswer, type QuizMode, type QuizQuestion } from "@/lib/quiz-model";

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
      <div className="quiz-game-topbar sticky top-25 z-20 -mx-5 -mt-5 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-t-2xl border-b border-slate-100 bg-white/95 px-5 py-3 backdrop-blur lg:top-0 lg:mx-0 lg:mt-0 lg:rounded-none lg:px-0 lg:py-0 lg:pb-4"><button type="button" onClick={onExit} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"><ArrowLeft size={16} /> Exit quiz</button><div className="flex items-center gap-4 text-sm"><span className="text-slate-500">Question {questionIndex + 1} of {questionCount}</span><span className="inline-flex items-center gap-1.5 font-semibold text-slate-700"><Clock3 size={16} /> {formatQuizTime(elapsedSeconds)}</span></div></div>
      <div className="quiz-game-progress mt-5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${((questionIndex + 1) / questionCount) * 100}%` }} /></div>
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

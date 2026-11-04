"use client";

import type { FormEvent } from "react";
import { ArrowLeft, Clock3, Star, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { PronunciationButton } from "@/components/vocabulary/PronunciationButton";
import { QuizImage } from "@/components/quiz/QuizPreview";
import { expectedAnswer, formatQuizTime, type QuizAnswer, type QuizMode, type QuizQuestion } from "@/lib/quiz-model";

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
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmitAnswer(input);
  }

  return (
    <Card className="quiz-game-card mx-auto max-w-5xl p-5 sm:p-8">
      <div className="quiz-game-topbar sticky top-25 z-20 -mx-5 -mt-5 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-t-2xl border-b border-slate-100 bg-white/95 px-5 py-3 backdrop-blur lg:top-0 lg:mx-0 lg:mt-0 lg:rounded-none lg:px-0 lg:py-0 lg:pb-4"><button type="button" onClick={onExit} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"><ArrowLeft size={16} /> Exit quiz</button><div className="flex items-center gap-4 text-sm"><span className="text-slate-500">Question {questionIndex + 1} of {questionCount}</span><span className="inline-flex items-center gap-1.5 font-semibold text-slate-700"><Clock3 size={16} /> {formatQuizTime(elapsedSeconds)}</span></div></div>
      <div className="quiz-game-progress mt-5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${((questionIndex + 1) / questionCount) * 100}%` }} /></div>
      <div className="quiz-game-prompt flex md:min-h-[360px] flex-col items-center justify-center pt-3 text-center sm:pt-6">
        {mode === "type-word" ? <><QuizImage word={question.word} className="quiz-game-image" /><p className="mt-5 inline-flex items-center gap-1.5 text-sm text-slate-500">What is this word?<PronunciationButton word={question.word.word} /></p><form id="quiz-type-word-answer" onSubmit={handleSubmit} className="mt-4 flex w-full max-w-md flex-col gap-3 sm:flex-row"><input autoFocus value={input} onChange={(event) => onInputChange(event.target.value)} disabled={Boolean(answer)} aria-label="Type the vocabulary word" placeholder="Type the word…" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-center text-base outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50" />{!answer && <Button type="submit" disabled={!input.trim()} className="hidden sm:inline-flex">Check</Button>}</form></> : <>
          {question.choiceType === "word"
            ? <p className="text-3xl font-bold text-slate-950 sm:text-4xl">{question.meaning}</p>
            : question.word.imagePath ? <QuizImage word={question.word} className="quiz-game-image" /> : <p className="text-3xl font-bold text-slate-950 sm:text-4xl">{question.word.word}</p>}
          {question.partOfSpeech && <span className="mt-4 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium capitalize text-blue-700">{question.partOfSpeech}</span>}
          <p className="mt-4 text-sm text-slate-500">{question.choiceType === "word" ? "Choose the matching word" : "Choose the correct meaning"}</p><div className="quiz-game-answers mt-4 grid w-full max-w-3xl grid-cols-2 gap-3">{question.choices.map((choice, index) => <button key={`${choice}-${index}`} type="button" disabled={Boolean(answer)} onClick={() => onSubmitAnswer(choice)} className={`quiz-game-answer min-h-14 rounded-xl border px-4 py-3 text-left text-sm transition disabled:cursor-default ${answer && choice === expectedAnswer(question, mode) ? "is-correct border-emerald-300 bg-emerald-50 font-medium text-emerald-800" : answer?.value === choice && !answer.correct ? "is-wrong border-red-300 bg-red-50 font-medium text-red-800" : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"}`}><span className="quiz-answer-letter">{String.fromCharCode(65 + index)}</span>{choice}</button>)}</div>
        </>}
        {answer && <div className="quiz-game-feedback mt-5 flex w-full max-w-3xl flex-col items-center gap-3" role="status">{answer.correct ? <p className="quiz-correct-feedback"><Star size={24} fill="currentColor" /> Correct! <span>Great job! 🎉</span></p> : <AutoDismissMessage key={`${questionIndex}:${answer.value}`} variant="error" className="inline-flex items-center gap-2 bg-transparent p-0 font-semibold"><X size={17} />{`The answer is: ${expectedAnswer(question, mode)}`}</AutoDismissMessage>}<Button onClick={onNext} className="hidden sm:inline-flex">{questionIndex + 1 === questionCount ? "See results" : "Next question"}</Button></div>}
      </div>
    </Card>
  );
}

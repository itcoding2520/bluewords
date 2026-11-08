"use client";

import { memo } from "react";
import { QuizQuestionImage } from "@/components/quiz/QuizQuestionImage";
import { expectedAnswer, getQuizChoicePromptKind } from "@/lib/quiz-answer-model";
import type { QuizAnswer, QuizMode, QuizQuestion } from "@/lib/quiz-model";

export const QuizChoiceQuestion = memo(function QuizChoiceQuestion({
  question,
  mode,
  answer,
  onSubmitAnswer,
}: {
  question: QuizQuestion;
  mode: QuizMode;
  answer: QuizAnswer | undefined;
  onSubmitAnswer: (answer: string) => void;
}) {
  const promptKind = getQuizChoicePromptKind(question);

  return (
    <>
      {promptKind === "meaning" ? (
        <p className="text-3xl font-bold text-slate-950 sm:text-4xl">{question.meaning}</p>
      ) : promptKind === "image" ? (
        <QuizQuestionImage word={question.word} className="quiz-game-image" />
      ) : (
        <p className="text-3xl font-bold text-slate-950 sm:text-4xl">{question.word.word}</p>
      )}
      {question.partOfSpeech && <span className="mt-4 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium capitalize text-blue-700">{question.partOfSpeech}</span>}
      <p className="mt-4 text-sm text-slate-500">{question.choiceType === "word" ? "Choose the matching word" : "Choose the correct meaning"}</p>
      <div className="quiz-game-answers mt-4 grid w-full max-w-3xl grid-cols-2 gap-3">
        {question.choices.map((choice, index) => (
          <button
            key={`${choice}-${index}`}
            type="button"
            disabled={Boolean(answer)}
            onClick={() => onSubmitAnswer(choice)}
            className={`quiz-game-answer min-h-14 rounded-xl border px-4 py-3 text-left text-sm transition disabled:cursor-default ${answer && choice === expectedAnswer(question, mode) ? "is-correct border-emerald-300 bg-emerald-50 font-medium text-emerald-800" : answer?.value === choice && !answer.correct ? "is-wrong border-red-300 bg-red-50 font-medium text-red-800" : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"}`}
          >
            <span className="quiz-answer-letter">{String.fromCharCode(65 + index)}</span>{choice}
          </button>
        ))}
      </div>
    </>
  );
});

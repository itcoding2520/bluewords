"use client";

import { memo, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { PronunciationButton } from "@/components/vocabulary/PronunciationButton";
import { QuizQuestionImage } from "@/components/quiz/QuizQuestionImage";
import type { QuizAnswer } from "@/lib/quiz-model";
import type { VocabularyWord } from "@/data/vocabulary";

export const QuizTypeWordQuestion = memo(function QuizTypeWordQuestion({
  word,
  answer,
  input,
  onInputChange,
  onSubmitAnswer,
}: {
  word: VocabularyWord;
  answer: QuizAnswer | undefined;
  input: string;
  onInputChange: (input: string) => void;
  onSubmitAnswer: (answer: string) => void;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmitAnswer(input);
  }

  return (
    <>
      <QuizQuestionImage word={word} className="quiz-game-image" />
      <p className="mt-5 inline-flex items-center gap-1.5 text-sm text-slate-500">
        What is this word?<PronunciationButton word={word.word} />
      </p>
      <form id="quiz-type-word-answer" onSubmit={handleSubmit} className="mt-4 flex w-full max-w-md flex-col gap-3 sm:flex-row">
        <input
          autoFocus
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          disabled={Boolean(answer)}
          aria-label="Type the vocabulary word"
          placeholder="Type the word…"
          className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-center text-base outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50"
        />
        {!answer && <Button type="submit" disabled={!input.trim()} className="hidden sm:inline-flex">Check</Button>}
      </form>
    </>
  );
});

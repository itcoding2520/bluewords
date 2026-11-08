"use client";

import { QuizQuestionImage } from "@/components/quiz/QuizQuestionImage";
import type { VocabularyWord } from "@/data/vocabulary";
import { expectedAnswer } from "@/lib/quiz-answer-model";
import type { QuizMode, QuizQuestion } from "@/lib/quiz-model";

export function QuizPreviewQuestion({ mode, meaningQuestion, typeWord }: {
  mode: QuizMode;
  meaningQuestion?: QuizQuestion;
  typeWord?: VocabularyWord;
}) {
  return (
    <div className="mt-5 rounded-2xl border border-indigo-100 bg-white p-4">
      {mode === "choose-meaning" ? meaningQuestion ? (
        <>
          {meaningQuestion.choiceType === "word"
            ? <p className="py-5 text-center text-2xl font-bold text-slate-900">{meaningQuestion.meaning}</p>
            : meaningQuestion.word.imagePath ? <QuizQuestionImage word={meaningQuestion.word} className="quiz-preview-image mx-auto" /> : <p className="py-5 text-center text-2xl font-bold text-slate-900">{meaningQuestion.word.word}</p>}
          {meaningQuestion.partOfSpeech && <span className="mt-3 inline-block rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-medium capitalize text-blue-700">{meaningQuestion.partOfSpeech}</span>}
          <p className="mt-3 text-xs text-slate-500">{meaningQuestion.choiceType === "word" ? "Choose the matching word" : "Choose the correct meaning"}</p>
          <div className="mt-3 grid gap-2">
            {meaningQuestion.choices.map((choice, index) => <div key={`${choice}-${index}`} className={`rounded-lg border px-3 py-2 text-xs ${choice === expectedAnswer(meaningQuestion, mode) ? "border-emerald-200 bg-emerald-50 font-medium text-emerald-800" : "border-slate-200 bg-white text-slate-600"}`}><span className="mr-2 text-[10px] font-semibold text-slate-400">{String.fromCharCode(65 + index)}.</span>{choice}</div>)}
          </div>
        </>
      ) : <p className="py-8 text-center text-sm text-slate-500">Add more vocabulary with meanings to preview this question type.</p> : typeWord ? (
        <>
          <QuizQuestionImage word={typeWord} className="quiz-preview-image mx-auto" />
          <p className="mt-4 text-center text-xs text-slate-500">What is this word?</p>
          <div className="mt-3 rounded-xl border border-slate-200 px-3 py-2.5 text-center text-xs text-slate-400">Type the word…</div>
        </>
      ) : <p className="py-8 text-center text-sm text-slate-500">Add images to vocabulary words to preview this question type.</p>}
    </div>
  );
}

"use client";

import { Star } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { QuizQuestionImage } from "@/components/quiz/QuizQuestionImage";
import type { VocabularyWord } from "@/data/vocabulary";
import { expectedAnswer, type QuizMode, type QuizQuestion } from "@/lib/quiz-model";

export function QuizPreview({
  mode,
  category,
  questionCount,
  meaningQuestion,
  typeWord,
}: {
  mode: QuizMode;
  category: string;
  questionCount: number;
  meaningQuestion?: QuizQuestion;
  typeWord?: VocabularyWord;
}) {
  const settings = [
    mode === "choose-meaning" ? "Choose meaning" : "Type the word",
    category === "all" ? "All categories" : category,
    `${questionCount} questions`,
  ];

  return (
    <Card className="quiz-preview-card border-indigo-100 bg-indigo-50/70 p-5 sm:p-8">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-500">Your quiz preview</p>
      <h2 className="quiz-preview-title mt-3 flex items-center gap-2 text-xl font-bold text-slate-900"><span>{mode === "choose-meaning" ? "Choose the meaning" : "Type the word"}</span><Star aria-hidden="true" size={20} className="fill-amber-400 text-amber-400" /></h2>
      <p className="mt-1 text-sm text-slate-500">This is how a question will look.</p>

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

      <div className="mt-5 border-t border-indigo-200/70 pt-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-500">Quiz settings</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {settings.map((setting) => <span key={setting} className="rounded-full border border-indigo-100 bg-white px-3 py-2 text-xs font-semibold text-slate-700">{setting}</span>)}
        </div>
        <p className="mt-5 text-xs text-slate-500">Questions are chosen from your vocabulary.</p>
      </div>
    </Card>
  );
}

"use client";

import { ArrowRight, Check, Volume2 } from "lucide-react";
import type { Item } from "@/lib/communication/lesson-types";
import { AnswerChoiceList } from "@/components/communication/AnswerChoiceList";

type Props = {
  item?: Item;
  question: number;
  questionCount: number;
  choices: string[];
  answer: string | null;
  saving: boolean;
  onListen: (item: Item) => void;
  onSelect: (answer: string) => void;
  onNext: () => void;
  onPracticeAgain: () => void;
};

export function QuickPracticeView({ item, question, questionCount, choices, answer, saving, onListen, onSelect, onNext, onPracticeAgain }: Props) {
  if (!item) {
    return <div className="rounded-3xl bg-emerald-50 p-8 text-center">
      <Check className="mx-auto text-emerald-600" size={34}/>
      <h2 className="mt-3 text-xl font-extrabold text-slate-900">Practice round complete</h2>
      <p className="mt-1 text-sm text-slate-600">You reviewed {questionCount} items. Correct and incorrect answers are saved to your review schedule when signed in.</p>
      <button type="button" onClick={onPracticeAgain} className="mt-5 min-h-11 rounded-full bg-blue-600 px-5 text-sm font-bold text-white">Practice again</button>
    </div>;
  }

  return <>
    <div className="mb-5 flex items-center justify-between gap-3">
      <div><p className="text-xs font-bold uppercase tracking-wide text-violet-700">Meaning check</p><p className="mt-1 text-sm text-slate-500">Question {question + 1} of {questionCount}</p></div>
      <button type="button" onClick={() => onListen(item)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-sky-200 px-4 text-sm font-semibold text-blue-700"><Volume2 size={17}/> Listen</button>
    </div>
    <article className="rounded-3xl bg-gradient-to-br from-violet-50 via-white to-sky-50 p-6 text-center sm:p-9">
      <p className="text-sm font-semibold text-slate-500">Choose the Vietnamese meaning</p>
      <h2 className="mt-2 break-words text-3xl font-extrabold text-slate-900 sm:text-4xl">{item.content_en}</h2>
    </article>
    <AnswerChoiceList choices={choices} selectedAnswer={answer} correctAnswer={item.meaning_vi} disabled={answer !== null || saving} onSelect={onSelect}/>
    {answer !== null && <div className={`mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4 ${answer === item.meaning_vi ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}>
      <p className="font-bold">{answer === item.meaning_vi ? "Correct! Nice recall." : `Not quite. The answer is “${item.meaning_vi}”.`}</p>
      <button type="button" onClick={onNext} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-blue-600 px-4 text-sm font-bold text-white">Next question <ArrowRight size={16}/></button>
    </div>}
  </>;
}

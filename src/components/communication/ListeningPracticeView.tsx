"use client";

import { ArrowRight, Check, Headphones, Volume2 } from "lucide-react";
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
  onListenAgain: () => void;
};

export function ListeningPracticeView({ item, question, questionCount, choices, answer, saving, onListen, onSelect, onNext, onListenAgain }: Props) {
  if (!item) {
    return <div className="rounded-3xl bg-emerald-50 p-8 text-center">
      <Check className="mx-auto text-emerald-600" size={34}/>
      <h2 className="mt-3 text-xl font-extrabold text-slate-900">Listening round complete</h2>
      <p className="mt-1 text-sm text-slate-600">You listened to {questionCount} example sentences. Answers are added to item review scheduling when you are signed in.</p>
      <button type="button" onClick={onListenAgain} className="mt-5 min-h-11 rounded-full bg-blue-600 px-5 text-sm font-bold text-white">Listen again</button>
    </div>;
  }

  return <>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-xs font-bold uppercase tracking-wide text-violet-700">Listening comprehension</p><p className="mt-1 text-sm text-slate-500">Question {question + 1} of {questionCount}</p></div>
      <button type="button" onClick={() => onListen(item)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-sky-200 px-4 text-sm font-semibold text-blue-700"><Volume2 size={17}/> Play audio</button>
    </div>
    <article className="rounded-3xl bg-gradient-to-br from-violet-50 via-white to-sky-50 p-6 text-center sm:p-9">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-violet-100 text-violet-700"><Headphones size={28}/></span>
      <p className="mt-4 text-sm font-semibold text-slate-500">Listen to the English sentence and choose what it means.</p>
      <p className="mt-2 text-xs text-slate-400">The transcript appears after you answer. You can replay the audio.</p>
    </article>
    <AnswerChoiceList choices={choices} selectedAnswer={answer} correctAnswer={item.example_vi} disabled={answer !== null || saving} onSelect={onSelect}/>
    {answer !== null && <div className={`mt-4 rounded-2xl p-4 ${answer === item.example_vi ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}>
      <p className="font-bold">{answer === item.example_vi ? "Correct! You understood the sentence." : `Not quite. The meaning is “${item.example_vi}”.`}</p>
      <p className="mt-2 text-sm">“{item.example_en}”</p>
      <button type="button" onClick={onNext} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-full bg-blue-600 px-4 text-sm font-bold text-white">Next sentence <ArrowRight size={16}/></button>
    </div>}
  </>;
}

"use client";

import { Volume2 } from "lucide-react";
import type { Turn } from "@/lib/communication/lesson-types";
import { SpeechPractice } from "@/components/communication/SpeechPractice";

export function DialogueTurnView({ turn, selectedAnswer, onPlay, onSelect }: {
  turn: Turn;
  selectedAnswer?: string;
  onPlay: (turn: Turn) => void;
  onSelect: (turn: Turn, answer: string) => void;
}) {
  const interactive = turn.response_options.length > 0;
  const isCorrect = selectedAnswer === turn.expected_response;
  const showResponse = !interactive || isCorrect;

  return <div className="rounded-2xl bg-white p-3">
    <div className="flex items-start gap-3">
      {showResponse && <button type="button" aria-label={`Play ${turn.speaker}'s line`} onClick={() => onPlay(turn)} className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700"><Volume2 size={17}/></button>}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{interactive && !isCorrect ? "Your turn" : turn.speaker}</p>
        {showResponse ? <><p className="font-semibold text-slate-900">{turn.text_en}</p>{turn.meaning_vi && <p className="text-sm text-slate-500">{turn.meaning_vi}</p>}</> : <p className="font-semibold text-violet-800">Choose a natural response to the line above.</p>}
        {interactive && <div className="mt-3">
          <div className="flex flex-wrap gap-2">{turn.response_options.map((option) => {
            const selected = selectedAnswer === option;
            const optionIsCorrect = option === turn.expected_response;
            const style = selected && optionIsCorrect ? "border-emerald-300 bg-emerald-50 text-emerald-800" : selected ? "border-rose-300 bg-rose-50 text-rose-800" : "border-slate-200 bg-white text-slate-700 hover:border-blue-300";
            return <button key={option} type="button" disabled={isCorrect} onClick={() => onSelect(turn, option)} className={`rounded-xl border px-3 py-2 text-sm font-medium disabled:cursor-default ${style}`}>{option}</button>;
          })}</div>
          {selectedAnswer && !isCorrect && <p role="status" className="mt-2 text-sm font-semibold text-rose-700">Not quite. Try another response.</p>}
          {isCorrect && <p role="status" className="mt-2 text-sm font-semibold text-emerald-700">That’s a natural response!</p>}
          {isCorrect && <SpeechPractice expected={turn.expected_response}/>}
        </div>}
      </div>
    </div>
  </div>;
}

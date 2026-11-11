"use client";

import { ArrowRight, Check, Volume2 } from "lucide-react";
import type { Item } from "@/hooks/useSituationalEnglishLessonData";
import type { SentenceDrill } from "@/lib/communication/lesson-practice";
import { normalizeSentence } from "@/lib/communication/lesson-practice";

type OrderedTile = { id: number; text: string };

type Props = {
  drill?: SentenceDrill<Item>;
  step: number;
  drillCount: number;
  answer: string | null;
  orderedTiles: OrderedTile[];
  saving: boolean;
  onListen: (text: string, item: Item) => void;
  onSubmit: (answer: string) => void;
  onNext: () => void;
  onPracticeAgain: () => void;
  onOrderedTilesChange: (tiles: OrderedTile[]) => void;
};

export function SentenceDrillView({
  drill,
  step,
  drillCount,
  answer,
  orderedTiles,
  saving,
  onListen,
  onSubmit,
  onNext,
  onPracticeAgain,
  onOrderedTilesChange,
}: Props) {
  if (!drill) {
    return <div className="rounded-3xl bg-emerald-50 p-8 text-center">
      <Check className="mx-auto text-emerald-600" size={34}/>
      <h2 className="mt-3 text-xl font-extrabold text-slate-900">Sentence practice complete</h2>
      <p className="mt-1 text-sm text-slate-600">You completed {drillCount} sentence exercises. Results update the review schedule when signed in.</p>
      <button type="button" onClick={onPracticeAgain} className="mt-5 min-h-11 rounded-full bg-blue-600 px-5 text-sm font-bold text-white">Practice again</button>
    </div>;
  }

  const isCorrect = answer !== null && normalizeSentence(answer) === normalizeSentence(drill.answer);
  const selectTile = (tile: OrderedTile) => onOrderedTilesChange([...orderedTiles, tile]);
  const removeTile = (tileId: number) => onOrderedTilesChange(orderedTiles.filter((tile) => tile.id !== tileId));
  const completeSentence = (choice: string) => (drill.gapSentence ?? "").replace("________", choice);

  return <>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-violet-700">{drill.kind === "complete" ? "Complete the sentence" : "Put the words in order"}</p>
        <p className="mt-1 text-sm text-slate-500">Exercise {step + 1} of {drillCount}</p>
      </div>
      <button type="button" onClick={() => onListen(drill.sentence, drill.item)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-sky-200 px-4 text-sm font-semibold text-blue-700"><Volume2 size={17}/> Listen</button>
    </div>
    <article className="rounded-3xl bg-gradient-to-br from-violet-50 via-white to-sky-50 p-5 text-center sm:p-8">
      <p className="text-sm font-semibold text-slate-500">Use the Vietnamese clue to make the English sentence</p>
      <p className="mt-2 text-lg font-bold text-blue-700">{drill.clue}</p>
      {drill.kind === "complete" ? <p className="mt-5 text-2xl font-extrabold leading-relaxed text-slate-900 sm:text-3xl">{drill.gapSentence}</p> : <p className="mt-5 text-sm text-slate-600">Tap each word tile in the correct order.</p>}
    </article>
    {drill.kind === "complete" && <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {drill.choices?.map((choice) => {
        const choiceSentence = completeSentence(choice);
        const isSelected = answer !== null && normalizeSentence(answer) === normalizeSentence(choiceSentence);
        const isCorrectChoice = normalizeSentence(choice) === normalizeSentence(drill.answer);
        const stateClass = answer !== null && isCorrectChoice
          ? "border-emerald-400 bg-emerald-50 text-emerald-900"
          : isSelected ? "border-rose-300 bg-rose-50 text-rose-900" : "border-slate-200 bg-white text-slate-800 hover:border-blue-300";
        return <button key={choice} type="button" disabled={answer !== null || saving} onClick={() => onSubmit(choiceSentence)} className={`min-h-12 rounded-2xl border px-4 py-3 text-left text-sm font-bold ${stateClass}`}>{choice}</button>;
      })}
    </div>}
    {drill.kind === "order" && <>
      <div className="mt-4 flex min-h-14 flex-wrap items-center justify-center gap-2 rounded-2xl border border-dashed border-sky-200 bg-sky-50/50 p-3">
        {orderedTiles.map((tile) => <button key={tile.id} type="button" disabled={answer !== null} onClick={() => removeTile(tile.id)} className="rounded-xl border border-blue-200 bg-white px-3 py-2 font-bold text-blue-900">{tile.text}</button>)}
        {orderedTiles.length === 0 && <span className="text-sm text-slate-400">Your sentence will appear here</span>}
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {drill.tiles?.filter((tile) => !orderedTiles.some((selected) => selected.id === tile.id)).map((tile) => <button key={tile.id} type="button" disabled={answer !== null || saving} onClick={() => selectTile(tile)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 font-bold text-slate-800 shadow-sm hover:border-blue-300">{tile.text}</button>)}
      </div>
      <div className="mt-4 flex justify-center gap-2">
        <button type="button" disabled={orderedTiles.length === 0 || answer !== null} onClick={() => onOrderedTilesChange([])} className="min-h-10 rounded-full border border-slate-200 px-4 text-sm font-bold text-slate-600 disabled:opacity-40">Clear</button>
        <button type="button" disabled={orderedTiles.length !== drill.tiles?.length || answer !== null || saving} onClick={() => onSubmit(orderedTiles.map((tile) => tile.text).join(" "))} className="min-h-10 rounded-full bg-blue-600 px-5 text-sm font-bold text-white disabled:opacity-40">Check sentence</button>
      </div>
    </>}
    {answer !== null && <div className={`mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4 ${isCorrect ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}>
      <p className="font-bold">{isCorrect ? "Correct! Great sentence." : <>The correct sentence is “{drill.answer}”</>}</p>
      <button type="button" onClick={onNext} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-blue-600 px-4 text-sm font-bold text-white">Next exercise <ArrowRight size={16}/></button>
    </div>}
  </>;
}

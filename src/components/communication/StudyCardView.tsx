"use client";

import { ArrowLeft, ArrowRight, Check, RotateCcw, Volume2 } from "lucide-react";
import type { Item } from "@/hooks/useSituationalEnglishLessonData";

export function StudyCardView({
  item,
  index,
  itemCount,
  revealed,
  status,
  saving,
  onReveal,
  onStatusChange,
  onPrevious,
  onNext,
  onListen,
}: {
  item: Item;
  index: number;
  itemCount: number;
  revealed: boolean;
  status: "learning" | "mastered";
  saving: boolean;
  onReveal: () => void;
  onStatusChange: (status: "learning" | "mastered") => void;
  onPrevious: () => void;
  onNext: () => void;
  onListen: () => void;
}) {
  return <div className="p-4 sm:p-7">
    <div className="mb-5 flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-blue-600">{item.item_type.replace("_", " ")}</p><p className="mt-1 text-sm text-slate-500">Item {index + 1} of {itemCount}</p></div><button type="button" onClick={onListen} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-sky-200 px-4 text-sm font-semibold text-blue-700"><Volume2 size={17}/> Listen</button></div>
    <article className="rounded-3xl bg-gradient-to-br from-sky-50 to-white p-6 text-center sm:p-10"><h2 className="break-words text-3xl font-extrabold text-slate-900 sm:text-4xl">{item.content_en}</h2>{revealed ? <div className="mt-5 space-y-2"><p className="text-xl font-bold text-blue-700">{item.meaning_vi}</p>{item.example_en && <p className="mx-auto max-w-2xl text-lg text-slate-700">{item.example_en}</p>}{item.example_vi && <p className="text-sm text-slate-500">{item.example_vi}</p>}</div> : <button type="button" onClick={onReveal} className="mt-6 min-h-11 rounded-full border border-blue-300 bg-white px-6 text-sm font-bold text-blue-700 shadow-sm">Show meaning</button>}</article>
    {revealed && <div className="mt-4 flex flex-wrap justify-center gap-3"><button type="button" disabled={saving} onClick={() => onStatusChange("learning")} className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-5 text-sm font-bold ${status === "learning" ? "border-amber-300 bg-amber-50 text-amber-800" : "border-slate-200 bg-white text-slate-600"}`}><RotateCcw size={16}/> Learning</button><button type="button" disabled={saving} onClick={() => onStatusChange("mastered")} className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-5 text-sm font-bold ${status === "mastered" ? "border-emerald-400 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-600"}`}><Check size={16}/> Mastered</button></div>}
    <div className="mt-5 flex items-center justify-center gap-3"><button type="button" disabled={index === 0} onClick={onPrevious} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-sky-200 px-5 text-sm font-bold text-blue-700 disabled:opacity-40"><ArrowLeft size={16}/> Previous</button><button type="button" disabled={index >= itemCount - 1} onClick={onNext} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-blue-600 px-5 text-sm font-bold text-white disabled:opacity-40">Next item <ArrowRight size={16}/></button></div>
  </div>;
}

"use client";

import { Headphones, Zap } from "lucide-react";

export type LessonMode = "study" | "practice" | "drills" | "listening";

export function LessonModeTabs({ mode, practiceDisabled, drillsDisabled, listeningDisabled, onSelect }: {
  mode: LessonMode;
  practiceDisabled: boolean;
  drillsDisabled: boolean;
  listeningDisabled: boolean;
  onSelect: (mode: LessonMode) => void;
}) {
  const buttonClass = (active: boolean) => `min-h-10 rounded-xl px-4 text-sm font-bold disabled:opacity-40 ${active ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"}`;

  return <div className="flex flex-wrap border-b border-sky-100 bg-sky-50/60 p-2">
    <button type="button" onClick={() => onSelect("study")} aria-pressed={mode === "study"} className={buttonClass(mode === "study")}>Study cards</button>
    <button type="button" onClick={() => onSelect("practice")} aria-pressed={mode === "practice"} disabled={practiceDisabled} className={`inline-flex items-center gap-2 ${buttonClass(mode === "practice")}`}><Zap size={16}/> Quick practice</button>
    <button type="button" onClick={() => onSelect("drills")} aria-pressed={mode === "drills"} disabled={drillsDisabled} className={buttonClass(mode === "drills")}>Sentence drills</button>
    <button type="button" onClick={() => onSelect("listening")} aria-pressed={mode === "listening"} disabled={listeningDisabled} className={`inline-flex items-center gap-2 ${buttonClass(mode === "listening")}`}><Headphones size={16}/> Listening</button>
  </div>;
}

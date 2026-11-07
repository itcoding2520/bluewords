"use client";

import Link from "next/link";
import { ArrowLeft, Gamepad2, History, Star } from "lucide-react";
import type { QuizTab } from "@/lib/quiz-model";

export function QuizPageHeader({
  isPlaying,
  activeTab,
  showHistory,
  onPlay,
  onHistory,
}: {
  isPlaying: boolean;
  activeTab: QuizTab;
  showHistory: boolean;
  onPlay: () => void;
  onHistory: () => void;
}) {
  return (
    <>
      {isPlaying ? (
        <button type="button" onClick={onPlay} className="mb-2 sm:mb-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
          <ArrowLeft size={16} /> Back to Setup
        </button>
      ) : (
        <Link href="/games" className="mb-2 sm:mb-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
          <ArrowLeft size={16} /> Back to Games
        </Link>
      )}

      <header className="quiz-hero mb-3 sm:mb-6">
        <h1 className="page-title quiz-title mt-1"><span>Vocabulary</span> <span className="quiz-title-accent">Quiz</span> <Star aria-hidden="true" className="quiz-title-star inline size-6 fill-amber-400 text-amber-400" /></h1>
        <p className="page-intro-description mt-2 hidden sm:block">Choose how many words to practice. We’ll track how long you take.</p>
      </header>

      {showHistory && (
        <div className="quiz-tabs mb-5 flex gap-2 border-b border-slate-200">
          <TabButton active={activeTab === "play"} onClick={onPlay}><Gamepad2 size={16} /> Play quiz</TabButton>
          <TabButton active={activeTab === "history"} onClick={onHistory}><History size={16} /> History</TabButton>
        </div>
      )}
    </>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium ${active ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>{children}</button>;
}

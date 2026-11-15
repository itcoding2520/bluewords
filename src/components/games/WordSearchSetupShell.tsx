import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, Gamepad2, History, Star } from "lucide-react";

import { Button } from "@/components/ui/Button";

export function WordSearchSetupShell({
  userId,
  tab,
  showStickyStart,
  targetCount,
  onStart,
  onOpenPlay,
  onOpenHistory,
  children,
}: {
  userId: string | null;
  tab: "play" | "history";
  showStickyStart: boolean;
  targetCount: number;
  onStart: () => void;
  onOpenPlay: () => void;
  onOpenHistory: () => void;
  children: ReactNode;
}) {
  return (
    <div className={`word-search-setup-page ${showStickyStart ? "pb-24 sm:pb-0" : ""}`}>
      <Link href="/games" className="word-search-back-link mb-5 inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
        <ArrowLeft size={16} /> Back to Games
      </Link>
      <header className="word-search-setup-hero mb-6">
        <p className="text-sm font-bold text-blue-600">Vocabulary game</p>
        <h1 className="page-title mt-1 flex items-center gap-2">Word Search <Star className="size-6 fill-amber-400 text-amber-400" /></h1>
        <p className="page-intro-description mt-2">Find every vocabulary word in the letter grid as quickly as you can.</p>
      </header>

      <div className="word-search-setup-tabs mb-5 flex gap-2 border-b border-slate-200">
        <button type="button" onClick={onOpenPlay} className={`inline-flex min-h-11 items-center gap-2 border-b-2 px-3 text-sm font-medium ${tab === "play" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
          <Gamepad2 size={16} /> Play
        </button>
        {userId && (
          <button type="button" onClick={onOpenHistory} className={`inline-flex min-h-11 items-center gap-2 border-b-2 border-transparent px-3 text-sm font-medium text-slate-500 hover:text-slate-800 ${tab === "history" ? "!border-blue-600 !text-blue-700" : ""}`}>
            <History size={16} /> History
          </button>
        )}
      </div>

      {children}

      {showStickyStart && (
        <div className="word-search-sticky-start fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur sm:hidden">
          <Button onClick={onStart} disabled={targetCount === 0} className="min-h-12 w-full"><Gamepad2 size={17} /> Start game</Button>
        </div>
      )}
    </div>
  );
}

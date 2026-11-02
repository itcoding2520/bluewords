import Link from "next/link";
import { ArrowLeft, Clock3 } from "lucide-react";

import type { Difficulty } from "@/lib/word-search-config";

function formatDuration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function WordSearchGameHeader({
  isPlaying,
  difficulty,
  elapsedSeconds,
  onBackToSetup,
}: {
  isPlaying: boolean;
  difficulty: Difficulty;
  elapsedSeconds: number;
  onBackToSetup: () => void;
}) {
  return (
    <>
      {isPlaying ? (
        <div className="sticky top-25 z-20 -mx-2 mb-4 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-2 py-2.5 backdrop-blur lg:top-0 lg:mx-0 lg:bg-slate-50/95">
          <button type="button" onClick={onBackToSetup} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"><ArrowLeft size={16} /> Back to Setup</button>
          <div className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm"><Clock3 size={16} />{formatDuration(elapsedSeconds)}</div>
        </div>
      ) : (
        <Link href="/games" className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"><ArrowLeft size={16} /> Back to Games</Link>
      )}
      <header className="word-search-game-heading mb-3 flex flex-wrap items-end justify-between gap-3 md:mb-5">
        <p className="text-sm font-medium text-blue-600">Word Search · {difficulty}</p>
        <h1 className="page-title mt-1">Find the words</h1>
      </header>
    </>
  );
}

"use client";

import { Check, History, RotateCcw } from "lucide-react";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type SaveState = "idle" | "saving" | "saved" | "error";

type WordSearchResultsProps = {
  wordCount: number;
  duration: string;
  saveState: SaveState;
  saveError: string;
  onRetrySave: () => void;
  onPlayAgain: () => void;
  onViewHistory: () => void;
};

export function WordSearchResults({
  wordCount,
  duration,
  saveState,
  saveError,
  onRetrySave,
  onPlayAgain,
  onViewHistory,
}: WordSearchResultsProps) {
  return (
    <Card className="max-w-3xl p-6 text-center sm:p-10">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><Check size={27} /></span>
      <h2 className="mt-4 text-2xl font-bold text-slate-950">All words found!</h2>
      <p className="mt-2 text-slate-500">You found {wordCount} words in {duration}.</p>
      {saveState === "saving" && <p role="status" className="mt-3 text-sm text-slate-500">Saving your game history…</p>}
      {saveState === "saved" && <AutoDismissMessage variant="success" className="mx-auto mt-3 w-fit">Game saved to your history.</AutoDismissMessage>}
      {saveState === "error" && <div className="mt-3"><AutoDismissMessage key={saveError} variant="error">{saveError}</AutoDismissMessage><Button variant="secondary" className="mt-2" onClick={onRetrySave}>Retry save</Button></div>}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={onPlayAgain}><RotateCcw size={16} /> Play again</Button>
        {saveState === "saved" && <Button variant="secondary" onClick={onViewHistory}><History size={16} /> View history</Button>}
      </div>
    </Card>
  );
}

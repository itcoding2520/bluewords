"use client";

import { ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function QuizResultsActions({ onSetup, onPlayAgain }: { onSetup: () => void; onPlayAgain: () => void }) {
  return (
    <div className="mb-5 flex flex-wrap justify-between gap-2">
      <Button variant="secondary" onClick={onSetup}><ArrowLeft size={16} /> Setup</Button>
      <Button onClick={onPlayAgain}><RotateCcw size={16} /> Play again</Button>
    </div>
  );
}

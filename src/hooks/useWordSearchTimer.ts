"use client";

import type { GamePhase } from "@/types/game";
import { useElapsedTimer } from "@/hooks/useElapsedTimer";


export function useWordSearchTimer(phase: GamePhase, startedAt: number | null) {
  const timer = useElapsedTimer(startedAt, phase === "playing", phase === "results");

  return { elapsedSeconds: timer.elapsedSeconds, setElapsedSeconds: timer.setElapsedSeconds, reset: timer.reset };
}

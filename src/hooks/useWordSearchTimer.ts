"use client";

import { useElapsedTimer } from "@/hooks/useElapsedTimer";

type GamePhase = "setup" | "playing" | "results";

export function useWordSearchTimer(phase: GamePhase, startedAt: number | null) {
  const timer = useElapsedTimer(startedAt, phase === "playing", phase === "results");

  return { elapsedSeconds: timer.elapsedSeconds, setElapsedSeconds: timer.setElapsedSeconds, reset: timer.reset };
}

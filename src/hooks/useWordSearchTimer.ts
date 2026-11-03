"use client";

import { useCallback, useEffect, useState } from "react";

type GamePhase = "setup" | "playing" | "results";

export function useWordSearchTimer(phase: GamePhase, startedAt: number | null) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if ((phase !== "playing" && phase !== "results") || startedAt === null) return;

    const tick = () => setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    if (phase === "results") return;

    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [phase, startedAt]);

  const reset = useCallback(() => setElapsedSeconds(0), []);

  return { elapsedSeconds, setElapsedSeconds, reset };
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { getElapsedSeconds } from "@/lib/session-duration";

export function useElapsedTimer(
  startedAt: number | null,
  isRunning: boolean,
  updateWhenStopped = false
) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (startedAt === null || (!isRunning && !updateWhenStopped)) return;

    const update = () => setElapsedSeconds(getElapsedSeconds(startedAt));
    update();
    if (!isRunning) return;

    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [isRunning, startedAt, updateWhenStopped]);

  const reset = useCallback(() => setElapsedSeconds(0), []);

  return { elapsedSeconds, setElapsedSeconds, reset };
}

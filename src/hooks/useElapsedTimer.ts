"use client";

import { useCallback, useEffect, useState } from "react";

export function useElapsedTimer(
  startedAt: number | null,
  isRunning: boolean,
  updateWhenStopped = false
) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (startedAt === null || (!isRunning && !updateWhenStopped)) return;

    const update = () => setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    update();
    if (!isRunning) return;

    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [isRunning, startedAt, updateWhenStopped]);

  const reset = useCallback(() => setElapsedSeconds(0), []);

  return { elapsedSeconds, setElapsedSeconds, reset };
}

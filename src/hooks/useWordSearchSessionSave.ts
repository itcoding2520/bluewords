"use client";

import type { GamePhase, GameSaveState } from "@/types/game";
import { getErrorMessage } from "@/lib/errors";
import { getDurationSeconds } from "@/lib/session-duration";
import { useCallback, useEffect, useRef, useState } from "react";

import type { Difficulty, GridSize } from "@/lib/word-search-config";
import { saveWordSearchSession } from "@/lib/supabase/word-search-history";
import type { createWordSearchPuzzle } from "@/lib/word-search.mjs";

type Puzzle = ReturnType<typeof createWordSearchPuzzle>;

export function useWordSearchSessionSave({
  userId,
  phase,
  startedAt,
  puzzle,
  gridSize,
  difficulty,
  category,
  onSaved,
}: {
  userId: string | null;
  phase: GamePhase;
  startedAt: number | null;
  puzzle: Puzzle | null;
  gridSize: GridSize;
  difficulty: Difficulty;
  category: string;
  onSaved: (durationSeconds: number) => void;
}) {
  const [saveStatus, setSaveStatus] = useState<{ state: GameSaveState; error: string }>({ state: "idle", error: "" });
  const [saveRetryCount, setSaveRetryCount] = useState(0);
  const saveStartedRef = useRef<number | null>(null);
  const onSavedRef = useRef(onSaved);

  useEffect(() => {
    onSavedRef.current = onSaved;
  }, [onSaved]);

  const reset = useCallback(() => {
    saveStartedRef.current = null;
    setSaveStatus({ state: "idle", error: "" });
  }, []);

  const retry = useCallback(() => {
    saveStartedRef.current = null;
    setSaveRetryCount((count) => count + 1);
  }, []);

  useEffect(() => {
    if (!userId || phase !== "results" || startedAt === null || !puzzle || saveStartedRef.current === startedAt) return;
    saveStartedRef.current = startedAt;
    const completedAt = Date.now();
    const durationSeconds = getDurationSeconds(startedAt, completedAt);
    onSavedRef.current(durationSeconds);
    setSaveStatus({ state: "saving", error: "" });

    void saveWordSearchSession({
      gridSize,
      difficulty,
      category,
      words: puzzle.words.map(({ word }) => word),
      durationSeconds,
      startedAt: new Date(startedAt).toISOString(),
      completedAt: new Date(completedAt).toISOString(),
    }).then(() => {
      setSaveStatus({ state: "saved", error: "" });
    }).catch((error: unknown) => {
      saveStartedRef.current = null;
      setSaveStatus({ state: "error", error: getErrorMessage(error, "Could not save this game attempt.") });
    });
  }, [category, difficulty, gridSize, phase, puzzle, saveRetryCount, startedAt, userId]);

  return { saveState: saveStatus.state, saveError: saveStatus.error, reset, retry };
}

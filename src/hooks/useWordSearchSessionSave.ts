"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { Difficulty, GridSize } from "@/lib/word-search-config";
import { saveWordSearchSession } from "@/lib/supabase/word-search-history";
import type { createWordSearchPuzzle } from "@/lib/word-search.mjs";

type Puzzle = ReturnType<typeof createWordSearchPuzzle>;
type GamePhase = "setup" | "playing" | "results";

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
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState("");
  const [saveRetryCount, setSaveRetryCount] = useState(0);
  const saveStartedRef = useRef<number | null>(null);
  const onSavedRef = useRef(onSaved);

  useEffect(() => {
    onSavedRef.current = onSaved;
  }, [onSaved]);

  const reset = useCallback(() => {
    saveStartedRef.current = null;
    setSaveState("idle");
    setSaveError("");
  }, []);

  const retry = useCallback(() => {
    saveStartedRef.current = null;
    setSaveRetryCount((count) => count + 1);
  }, []);

  useEffect(() => {
    if (!userId || phase !== "results" || startedAt === null || !puzzle || saveStartedRef.current === startedAt) return;
    saveStartedRef.current = startedAt;
    const completedAt = Date.now();
    const durationSeconds = Math.max(0, Math.floor((completedAt - startedAt) / 1000));
    onSavedRef.current(durationSeconds);
    setSaveState("saving");
    setSaveError("");

    void saveWordSearchSession({
      gridSize,
      difficulty,
      category,
      words: puzzle.words.map(({ word }) => word),
      durationSeconds,
      startedAt: new Date(startedAt).toISOString(),
      completedAt: new Date(completedAt).toISOString(),
    }).then(() => {
      setSaveState("saved");
    }).catch((error: unknown) => {
      saveStartedRef.current = null;
      setSaveState("error");
      setSaveError(error instanceof Error ? error.message : "Could not save this game attempt.");
    });
  }, [category, difficulty, gridSize, phase, puzzle, saveRetryCount, startedAt, userId]);

  return { saveState, saveError, reset, retry };
}

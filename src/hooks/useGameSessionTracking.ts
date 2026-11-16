"use client";

import { getErrorMessage } from "@/lib/errors";
import { useEffect, useRef, useState } from "react";

import { saveVocabularyGameSession } from "@/lib/supabase/game-leaderboard";
import { useElapsedTimer } from "@/hooks/useElapsedTimer";
import type { GameSaveState, VocabularyGameType } from "@/types/game";

type GameType = Exclude<VocabularyGameType, "sentence-builder">;

export function useGameSessionTracking({
  isAuthenticated,
  isPlaying,
  shouldSubmit,
  gameType,
  roundSize,
  score,
  correctCount,
  moves,
  startedAt,
}: {
  isAuthenticated: boolean;
  isPlaying: boolean;
  shouldSubmit: boolean;
  gameType: GameType;
  roundSize: number;
  score: number;
  correctCount: number;
  moves: number;
  startedAt: number | null;
}) {
  const { elapsedSeconds, setElapsedSeconds, reset: resetElapsedSeconds } = useElapsedTimer(startedAt, isPlaying);
  const [saveState, setSaveState] = useState<GameSaveState>("idle");
  const [saveError, setSaveError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const submittedSessionRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !shouldSubmit || startedAt === null || submittedSessionRef.current === startedAt) return;
    submittedSessionRef.current = startedAt;
    const completedAt = Date.now();
    const durationSeconds = Math.max(0, Math.floor((completedAt - startedAt) / 1000));
    setElapsedSeconds(durationSeconds);
    setSaveState("saving");
    setSaveError("");

    void saveVocabularyGameSession({
      gameType,
      roundSize,
      score,
      correctCount,
      moves,
      durationSeconds,
      startedAt: new Date(startedAt).toISOString(),
      completedAt: new Date(completedAt).toISOString(),
    }).then(() => setSaveState("saved")).catch((error: unknown) => {
      submittedSessionRef.current = null;
      setSaveState("error");
      setSaveError(getErrorMessage(error, "Could not save this result."));
    });
  }, [correctCount, gameType, isAuthenticated, moves, retryCount, roundSize, score, shouldSubmit, startedAt, setElapsedSeconds]);

  function resetSession() {
    submittedSessionRef.current = null;
    resetElapsedSeconds();
    setSaveState("idle");
    setSaveError("");
  }

  function retrySave() {
    setRetryCount((count) => count + 1);
  }

  return { elapsedSeconds, setElapsedSeconds, saveState, saveError, resetSession, retrySave };
}

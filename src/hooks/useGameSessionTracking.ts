"use client";

import { useEffect, useRef, useState } from "react";

import { saveVocabularyGameSession } from "@/lib/supabase/game-leaderboard";

type GameType = "word-match" | "word-scramble" | "word-maze";
type SaveState = "idle" | "saving" | "saved" | "error";

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
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const submittedSessionRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying || startedAt === null) return;
    const updateClock = () => setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    updateClock();
    const interval = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(interval);
  }, [isPlaying, startedAt]);

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
      setSaveError(error instanceof Error ? error.message : "Could not save this result.");
    });
  }, [correctCount, gameType, isAuthenticated, moves, retryCount, roundSize, score, shouldSubmit, startedAt]);

  function resetSession() {
    submittedSessionRef.current = null;
    setElapsedSeconds(0);
    setSaveState("idle");
    setSaveError("");
  }

  function retrySave() {
    setRetryCount((count) => count + 1);
  }

  return { elapsedSeconds, setElapsedSeconds, saveState, saveError, resetSession, retrySave };
}

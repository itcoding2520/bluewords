import { useEffect, useRef, useState } from "react";
import type { GamePhase } from "@/types/game";
import { saveVocabularyGameSession } from "@/lib/supabase/game-leaderboard";

export function useSentenceBuilderResultSave({
  isAuthenticated,
  phase,
  startedAt,
  roundSize,
  score,
  correctCount,
  moves,
  durationSeconds,
}: {
  isAuthenticated: boolean;
  phase: GamePhase;
  startedAt: number | null;
  roundSize: number;
  score: number;
  correctCount: number;
  moves: number;
  durationSeconds: number;
}) {
  const [saveState, setSaveState] = useState("");
  const saveOnce = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || phase !== "results" || startedAt === null || saveOnce.current) return;
    saveOnce.current = true;
    setSaveState("Saving result…");
    void saveVocabularyGameSession({
      gameType: "sentence-builder",
      roundSize,
      score,
      correctCount,
      moves: Math.max(moves, correctCount),
      durationSeconds,
      startedAt: new Date(startedAt).toISOString(),
      completedAt: new Date().toISOString(),
    })
      .then(() => setSaveState("Result saved to the leaderboard."))
      .catch(() => setSaveState("Could not save your leaderboard result."));
  }, [correctCount, durationSeconds, isAuthenticated, moves, phase, roundSize, score, startedAt]);

  function resetSaveState() {
    saveOnce.current = false;
    setSaveState("");
  }

  return { saveState, resetSaveState };
}

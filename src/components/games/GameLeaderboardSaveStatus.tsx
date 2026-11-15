"use client";

import type { GameSaveState } from "@/types/game";

export function GameLeaderboardSaveStatus({
  isAuthenticated,
  saveState,
  saveError,
  onRetry,
}: {
  isAuthenticated: boolean;
  saveState: GameSaveState;
  saveError: string;
  onRetry: () => void;
}) {
  if (!isAuthenticated) return null;

  const message = saveState === "saving"
    ? "Saving your leaderboard result…"
    : saveState === "saved"
      ? "Result saved to the leaderboard."
      : saveState === "error" ? saveError : "";

  return (
    <p className={`word-match-save-state ${saveState}`} role="status">
      {message}
      {saveState === "error" && <button type="button" onClick={onRetry}>Try again</button>}
    </p>
  );
}

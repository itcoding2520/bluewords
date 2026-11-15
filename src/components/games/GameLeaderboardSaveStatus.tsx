"use client";

type SaveState = "idle" | "saving" | "saved" | "error";

export function GameLeaderboardSaveStatus({
  isAuthenticated,
  saveState,
  saveError,
  onRetry,
}: {
  isAuthenticated: boolean;
  saveState: SaveState;
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

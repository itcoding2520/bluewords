import { RotateCcw, Trophy } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { GameLeaderboardSaveStatus } from "@/components/games/GameLeaderboardSaveStatus";

export function WordScrambleResults({
  score,
  questionCount,
  bestStreak,
  timeLabel,
  isAuthenticated,
  saveState,
  saveError,
  onRetry,
  onPlayAgain,
}: {
  score: number;
  questionCount: number;
  bestStreak: number;
  timeLabel: string;
  isAuthenticated: boolean;
  saveState: "idle" | "saving" | "saved" | "error";
  saveError: string;
  onRetry: () => void;
  onPlayAgain: () => void;
}) {
  return (
    <Card className="word-scramble-results">
      <span className="word-scramble-trophy"><Trophy size={38} /></span>
      <p>ROUND COMPLETE</p>
      <h2>Awesome word star!</h2>
      <span className="word-scramble-final-score">{score}<small> points</small></span>
      <div>
        <span><strong>{questionCount}</strong><small>questions</small></span>
        <span><strong>{bestStreak}</strong><small>best streak</small></span>
        <span><strong>{timeLabel}</strong><small>time</small></span>
      </div>
      <GameLeaderboardSaveStatus
        isAuthenticated={isAuthenticated}
        saveState={saveState}
        saveError={saveError}
        onRetry={onRetry}
      />
      <button type="button" className="word-scramble-primary" onClick={onPlayAgain}>
        <RotateCcw size={18} /> Play again
      </button>
    </Card>
  );
}

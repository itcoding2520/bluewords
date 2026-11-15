import { RotateCcw, Trophy } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { GameLeaderboardSaveStatus } from "@/components/games/GameLeaderboardSaveStatus";
import { formatGameDuration } from "@/lib/game-duration";
import type { GameSaveState } from "@/types/game";

export function WordMatchResults({
  pairCount,
  score,
  moves,
  elapsedSeconds,
  isAuthenticated,
  saveState,
  saveError,
  onRetry,
  onPlayAgain,
  onChangeSettings,
}: {
  pairCount: number;
  score: number;
  moves: number;
  elapsedSeconds: number;
  isAuthenticated: boolean;
  saveState: GameSaveState;
  saveError: string;
  onRetry: () => void;
  onPlayAgain: () => void;
  onChangeSettings: () => void;
}) {
  return (
    <Card className="word-match-results-card">
      <span className="word-match-results-icon"><Trophy size={35} /></span>
      <p className="word-match-eyebrow">ROUND COMPLETE</p>
      <h2>Great matching!</h2>
      <p className="word-match-results-copy">You matched all {pairCount} pairs and scored {score} points.</p>
      <div className="word-match-result-stats">
        <span><strong>{score}</strong><small>score</small></span>
        <span><strong>{moves}</strong><small>moves</small></span>
        <span><strong>{formatGameDuration(elapsedSeconds)}</strong><small>time</small></span>
      </div>
      <GameLeaderboardSaveStatus
        isAuthenticated={isAuthenticated}
        saveState={saveState}
        saveError={saveError}
        onRetry={onRetry}
      />
      <div className="word-match-result-actions">
        <button type="button" onClick={onPlayAgain} className="word-match-start">
          <RotateCcw size={18} /> Play again
        </button>
        <button type="button" onClick={onChangeSettings} className="word-match-secondary">
          Change settings
        </button>
      </div>
    </Card>
  );
}

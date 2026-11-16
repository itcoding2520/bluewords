import { Clock3, RotateCcw, Star } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { GameLeaderboardSaveStatus } from "@/components/games/GameLeaderboardSaveStatus";
import { formatGameDuration } from "@/lib/game-duration";
import type { GameSaveState } from "@/types/game";

export function WordMazeResults({
  won, score, progress, roundLength, lives, elapsedSeconds, isAuthenticated, saveState, saveError, onRetry, onPlayAgain,
}: {
  won: boolean;
  score: number;
  progress: number;
  roundLength: number;
  lives: number;
  elapsedSeconds: number;
  isAuthenticated: boolean;
  saveState: GameSaveState;
  saveError: string;
  onRetry: () => void;
  onPlayAgain: () => void;
}) {
  return (
    <Card className={`word-maze-results ${won ? "is-won" : "is-lost"}`}>
      <span className="word-maze-result-mascot" aria-hidden="true">{won ? "🏆" : "📘"}</span>
      <p className="word-maze-hero-badge">{won ? "ADVENTURE COMPLETE" : "ADVENTURE PAUSED"}</p>
      <h2>{won ? "You found your way!" : "The path is still waiting"}</h2>
      <p>{won ? "Great job guiding your mascot through the maze." : "You ran out of lives. Try the maze again and keep exploring."}</p>
      <div className="word-maze-result-score"><Star size={22} fill="currentColor" /> {score} <small>points</small></div>
      <p className="word-maze-result-progress">{progress} of {roundLength} paths opened · {lives} lives left</p>
      <p className="word-maze-result-time"><Clock3 size={16} /> Completed in {formatGameDuration(elapsedSeconds)}</p>
      <GameLeaderboardSaveStatus isAuthenticated={isAuthenticated} saveState={saveState} saveError={saveError} onRetry={onRetry} />
      <button type="button" className="word-maze-primary" onClick={onPlayAgain}><RotateCcw size={19} /> Play again</button>
    </Card>
  );
}

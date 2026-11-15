import { ArrowLeft, Clock3, RotateCcw, Shuffle, Trophy } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { WordMatchCard } from "@/components/games/WordMatchCard";
import type { MatchCardData, MatchPair } from "@/hooks/useWordMatchController";
import { formatGameDuration } from "@/lib/game-duration";

export function WordMatchBoard({
  pairCount,
  pairs,
  cards,
  matchedIds,
  selectedCardIds,
  wrongCardIds,
  isResolving,
  moves,
  score,
  feedback,
  elapsedSeconds,
  pairById,
  matchedLabel,
  progressPercent,
  onSelectCard,
  onRestart,
  onExit,
}: {
  pairCount: number;
  pairs: MatchPair[];
  cards: MatchCardData[];
  matchedIds: Set<string>;
  selectedCardIds: string[];
  wrongCardIds: string[];
  isResolving: boolean;
  moves: number;
  score: number;
  feedback: string;
  elapsedSeconds: number;
  pairById: Map<string, MatchPair>;
  matchedLabel: string;
  progressPercent: number;
  onSelectCard: (card: MatchCardData, selectedAt: number) => void;
  onRestart: () => void;
  onExit: () => void;
}) {
  return (
    <Card className="word-match-board-card">
      <div className="word-match-board-header">
        <div className="word-match-board-heading">
          <div>
            <p className="word-match-eyebrow">WORD MATCH ADVENTURE</p>
            <h2>{matchedLabel}</h2>
          </div>
          <button type="button" onClick={onRestart} className="word-match-restart">
            <RotateCcw size={16} /> Restart
          </button>
        </div>
        <div className="word-match-stats">
          <span className="word-match-score-stat"><Trophy size={18} /> <small>Score</small> {score}</span>
          <span><Shuffle size={17} /> <small>Moves</small> {moves}</span>
          <span className="word-match-level-stat"><small>Level 1</small><strong>{matchedIds.size} / {pairs.length} pairs</strong><i><b style={{ width: `${progressPercent}%` }} /></i></span>
          <span><Clock3 size={17} /> {formatGameDuration(elapsedSeconds)}</span>
        </div>
      </div>
      <p className={`word-match-instruction ${feedback.startsWith("Great match") ? "is-success" : feedback.startsWith("Those cards") ? "is-error" : ""}`} aria-live="polite">
        {feedback}
      </p>
      <div className={`word-match-card-grid is-round-${pairCount}`}>
        {cards.map((card) => {
          const pair = pairById.get(card.pairId);
          if (!pair) return null;
          return (
            <WordMatchCard
              key={card.id}
              card={card}
              pair={pair}
              isRevealed={selectedCardIds.includes(card.id)}
              isMatched={matchedIds.has(card.pairId)}
              isWrong={wrongCardIds.includes(card.id)}
              locked={isResolving}
              onClick={() => onSelectCard(card, Date.now())}
            />
          );
        })}
      </div>
      <button type="button" onClick={onExit} className="word-match-exit">
        <ArrowLeft size={16} /> Exit round
      </button>
    </Card>
  );
}

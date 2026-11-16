import { useEffect, useRef, useState } from "react";
import { shuffle } from "@/lib/random";
import type { MatchCardData, MatchPair } from "@/lib/word-match";
import type { GamePhase } from "@/types/game";

export function useWordMatchGameplay(phase: GamePhase) {
  const [pairs, setPairs] = useState<MatchPair[]>([]);
  const [cards, setCards] = useState<MatchCardData[]>([]);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(() => new Set());
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [wrongCardIds, setWrongCardIds] = useState<string[]>([]);
  const [isResolving, setIsResolving] = useState(false);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const mismatchTimerRef = useRef<number | null>(null);
  const resolvingRef = useRef(false);

  useEffect(() => () => {
    if (mismatchTimerRef.current !== null) window.clearTimeout(mismatchTimerRef.current);
  }, []);

  function startRound(nextPairs: MatchPair[]) {
    if (mismatchTimerRef.current !== null) window.clearTimeout(mismatchTimerRef.current);
    const nextCards = nextPairs.flatMap((pair) => [
      { id: `${pair.id}:word`, pairId: pair.id, kind: "word" as const },
      { id: `${pair.id}:match`, pairId: pair.id, kind: "match" as const },
    ]);
    setPairs(nextPairs);
    setCards(shuffle(nextCards));
    setMatchedIds(new Set());
    setSelectedCardIds([]);
    setWrongCardIds([]);
    setMoves(0);
    setScore(0);
    setFeedback("Flip two cards to find a matching word and picture or meaning.");
    resolvingRef.current = false;
    setIsResolving(false);
  }

  function selectCard(card: MatchCardData): boolean {
    if (phase !== "playing" || matchedIds.has(card.pairId)
      || selectedCardIds.includes(card.id) || resolvingRef.current) return false;
    if (selectedCardIds.length === 0) {
      setSelectedCardIds([card.id]);
      setFeedback("Now flip one more card.");
      return false;
    }

    const firstCard = cards.find((item) => item.id === selectedCardIds[0]);
    if (!firstCard) return false;
    setMoves((count) => count + 1);
    setSelectedCardIds([firstCard.id, card.id]);
    if (firstCard.pairId === card.pairId && firstCard.kind !== card.kind) {
      const nextMatchedIds = new Set(matchedIds).add(card.pairId);
      setMatchedIds(nextMatchedIds);
      setSelectedCardIds([]);
      setScore((value) => value + 10);
      setFeedback("Great match! +10 points");
      return nextMatchedIds.size === pairs.length;
    }

    resolvingRef.current = true;
    setIsResolving(true);
    setWrongCardIds([firstCard.id, card.id]);
    setFeedback("Those cards do not match. Try again!");
    mismatchTimerRef.current = window.setTimeout(() => {
      setWrongCardIds([]);
      setSelectedCardIds([]);
      setFeedback("Flip two cards to find a matching word and picture or meaning.");
      resolvingRef.current = false;
      setIsResolving(false);
      mismatchTimerRef.current = null;
    }, 850);
    return false;
  }

  return {
    pairs,
    cards,
    matchedIds,
    selectedCardIds,
    wrongCardIds,
    isResolving,
    moves,
    score,
    feedback,
    startRound,
    selectCard,
  };
}

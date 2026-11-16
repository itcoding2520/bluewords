import { useEffect, useMemo, useRef, useState } from "react";
import { shuffle } from "@/lib/random";
import type { MatchCardData, MatchPair } from "@/lib/word-match";
import type { GamePhase } from "@/types/game";

interface WordMatchState {
  pairs: MatchPair[];
  cards: MatchCardData[];
  matchedIds: Set<string>;
  selectedCardIds: string[];
  wrongCardIds: string[];
  isResolving: boolean;
  moves: number;
  score: number;
  feedback: string;
}

const initialState: WordMatchState = {
  pairs: [],
  cards: [],
  matchedIds: new Set(),
  selectedCardIds: [],
  wrongCardIds: [],
  isResolving: false,
  moves: 0,
  score: 0,
  feedback: "",
};

export function useWordMatchGameplay(phase: GamePhase) {
  const [state, setState] = useState(initialState);
  const cardsById = useMemo(() => new Map(state.cards.map((card) => [card.id, card])), [state.cards]);
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
    setState({
      ...initialState,
      pairs: nextPairs,
      cards: shuffle(nextCards),
      feedback: "Flip two cards to find a matching word and picture or meaning.",
    });
    resolvingRef.current = false;
  }

  function selectCard(card: MatchCardData): boolean {
    if (phase !== "playing" || state.matchedIds.has(card.pairId)
      || state.selectedCardIds.includes(card.id) || resolvingRef.current) return false;
    if (state.selectedCardIds.length === 0) {
      setState((current) => ({
        ...current,
        selectedCardIds: [card.id],
        feedback: "Now flip one more card.",
      }));
      return false;
    }

    const firstCard = cardsById.get(state.selectedCardIds[0]);
    if (!firstCard) return false;
    const selectedPair = [firstCard.id, card.id];
    if (firstCard.pairId === card.pairId && firstCard.kind !== card.kind) {
      const nextMatchedIds = new Set(state.matchedIds).add(card.pairId);
      setState((current) => ({
        ...current,
        matchedIds: nextMatchedIds,
        selectedCardIds: [],
        moves: current.moves + 1,
        score: current.score + 10,
        feedback: "Great match! +10 points",
      }));
      return nextMatchedIds.size === state.pairs.length;
    }

    resolvingRef.current = true;
    setState((current) => ({
      ...current,
      selectedCardIds: selectedPair,
      wrongCardIds: selectedPair,
      isResolving: true,
      moves: current.moves + 1,
      feedback: "Those cards do not match. Try again!",
    }));
    mismatchTimerRef.current = window.setTimeout(() => {
      setState((current) => ({
        ...current,
        wrongCardIds: [],
        selectedCardIds: [],
        feedback: "Flip two cards to find a matching word and picture or meaning.",
        isResolving: false,
      }));
      resolvingRef.current = false;
      mismatchTimerRef.current = null;
    }, 850);
    return false;
  }

  return {
    pairs: state.pairs,
    cards: state.cards,
    matchedIds: state.matchedIds,
    selectedCardIds: state.selectedCardIds,
    wrongCardIds: state.wrongCardIds,
    isResolving: state.isResolving,
    moves: state.moves,
    score: state.score,
    feedback: state.feedback,
    startRound,
    selectCard,
  };
}

import { useEffect, useMemo, useRef, useState } from "react";
import type { VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { useVocabularyDropdownCategories } from "@/hooks/useVocabularyDropdownCategories";
import { useGameSessionTracking } from "@/hooks/useGameSessionTracking";
import { shuffle } from "@/lib/quiz-random";
import { buildWordMatchPairs, type MatchPair } from "@/lib/word-match";

type Phase = "setup" | "playing" | "results";
type PairCount = 6 | 8 | 10;
export type { MatchPair } from "@/lib/word-match";
export type MatchCardData = { id: string; pairId: string; kind: "word" | "match" };

export function useWordMatchController(input: {
  words: VocabularyWord[];
  categories: VocabularyCategoryRow[];
  isAuthenticated: boolean;
}) {
  const { words, categories, isAuthenticated } = input;
  const [category, setCategory] = useState("all");
  const [pairCount, setPairCount] = useState<PairCount>(6);
  const [phase, setPhase] = useState<Phase>("setup");
  const [pairs, setPairs] = useState<MatchPair[]>([]);
  const [cards, setCards] = useState<MatchCardData[]>([]);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(() => new Set());
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [wrongCardIds, setWrongCardIds] = useState<string[]>([]);
  const [isResolving, setIsResolving] = useState(false);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const mismatchTimerRef = useRef<number | null>(null);
  const resolvingRef = useRef(false);
  const session = useGameSessionTracking({
    isAuthenticated,
    isPlaying: phase === "playing",
    shouldSubmit: phase === "results",
    gameType: "word-match",
    roundSize: pairs.length,
    score,
    correctCount: pairs.length,
    moves,
    startedAt,
  });

  const availablePairs = useMemo(() => buildWordMatchPairs(words, category), [category, words]);

  const categoryDropdownCategories = useVocabularyDropdownCategories(categories, words);

  useEffect(() => () => {
    if (mismatchTimerRef.current !== null) window.clearTimeout(mismatchTimerRef.current);
  }, []);

  function startRound() {
    if (availablePairs.length < pairCount) return;
    if (mismatchTimerRef.current !== null) window.clearTimeout(mismatchTimerRef.current);
    const nextPairs = shuffle(availablePairs).slice(0, pairCount);
    const nextCards = nextPairs.flatMap((pair) => [
      { id: `${pair.id}:word`, pairId: pair.id, kind: "word" as const },
      { id: `${pair.id}:match`, pairId: pair.id, kind: "match" as const },
    ]);
    const now = Date.now();
    setPairs(nextPairs);
    setCards(shuffle(nextCards));
    setMatchedIds(new Set());
    setSelectedCardIds([]);
    setWrongCardIds([]);
    setMoves(0);
    setScore(0);
    setFeedback("Flip two cards to find a matching word and picture or meaning.");
    session.resetSession();
    setStartedAt(now);
    resolvingRef.current = false;
    setIsResolving(false);
    setPhase("playing");
  }

  function selectCard(card: MatchCardData, selectedAt: number) {
    if (phase !== "playing" || matchedIds.has(card.pairId)
      || selectedCardIds.includes(card.id) || resolvingRef.current) return;
    if (selectedCardIds.length === 0) {
      setSelectedCardIds([card.id]);
      setFeedback("Now flip one more card.");
      return;
    }

    const firstCard = cards.find((item) => item.id === selectedCardIds[0]);
    if (!firstCard) return;
    setMoves((count) => count + 1);
    setSelectedCardIds([firstCard.id, card.id]);
    if (firstCard.pairId === card.pairId && firstCard.kind !== card.kind) {
      const nextMatchedIds = new Set(matchedIds).add(card.pairId);
      setMatchedIds(nextMatchedIds);
      setSelectedCardIds([]);
      setScore((value) => value + 10);
      setFeedback("Great match! +10 points");
      if (nextMatchedIds.size === pairs.length) {
        session.setElapsedSeconds(startedAt === null
          ? session.elapsedSeconds
          : Math.floor((selectedAt - startedAt) / 1000));
        setPhase("results");
      }
      return;
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
  }

  const pairById = new Map(pairs.map((pair) => [pair.id, pair]));
  const matchedLabel = `${matchedIds.size} / ${pairs.length} pairs matched`;
  const progressPercent = pairs.length ? (matchedIds.size / pairs.length) * 100 : 0;

  return {
    category, setCategory, pairCount, setPairCount, phase, setPhase,
    pairs, cards, matchedIds, selectedCardIds, wrongCardIds, isResolving,
    moves, score, feedback, availablePairs, categoryDropdownCategories,
    elapsedSeconds: session.elapsedSeconds,
    saveState: session.saveState,
    saveError: session.saveError,
    retrySave: session.retrySave,
    pairById, matchedLabel, progressPercent, startRound, selectCard,
  };
}

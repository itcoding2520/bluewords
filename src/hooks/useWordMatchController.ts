import { useMemo, useState } from "react";
import type { VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { useVocabularyDropdownCategories } from "@/hooks/useVocabularyDropdownCategories";
import { useGameSessionTracking } from "@/hooks/useGameSessionTracking";
import { buildWordMatchPairs, type MatchCardData } from "@/lib/word-match";
import { useWordMatchGameplay } from "@/hooks/useWordMatchGameplay";
import { shuffle } from "@/lib/quiz-random";

type Phase = "setup" | "playing" | "results";
type PairCount = 6 | 8 | 10;
export type { MatchPair } from "@/lib/word-match";
export type { MatchCardData } from "@/lib/word-match";

export function useWordMatchController(input: {
  words: VocabularyWord[];
  categories: VocabularyCategoryRow[];
  isAuthenticated: boolean;
}) {
  const { words, categories, isAuthenticated } = input;
  const [category, setCategory] = useState("all");
  const [pairCount, setPairCount] = useState<PairCount>(6);
  const [phase, setPhase] = useState<Phase>("setup");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const gameplay = useWordMatchGameplay(phase);
  const session = useGameSessionTracking({
    isAuthenticated,
    isPlaying: phase === "playing",
    shouldSubmit: phase === "results",
    gameType: "word-match",
    roundSize: gameplay.pairs.length,
    score: gameplay.score,
    correctCount: gameplay.pairs.length,
    moves: gameplay.moves,
    startedAt,
  });

  const availablePairs = useMemo(() => buildWordMatchPairs(words, category), [category, words]);

  const categoryDropdownCategories = useVocabularyDropdownCategories(categories, words);

  function startRound() {
    if (availablePairs.length < pairCount) return;
    const nextPairs = shuffle(availablePairs).slice(0, pairCount);
    const now = Date.now();
    gameplay.startRound(nextPairs);
    session.resetSession();
    setStartedAt(now);
    setPhase("playing");
  }

  function selectCard(card: MatchCardData, selectedAt: number) {
    if (!gameplay.selectCard(card)) return;
    session.setElapsedSeconds(startedAt === null
      ? session.elapsedSeconds
      : Math.floor((selectedAt - startedAt) / 1000));
    setPhase("results");
  }

  const pairById = new Map(gameplay.pairs.map((pair) => [pair.id, pair]));
  const matchedLabel = `${gameplay.matchedIds.size} / ${gameplay.pairs.length} pairs matched`;
  const progressPercent = gameplay.pairs.length ? (gameplay.matchedIds.size / gameplay.pairs.length) * 100 : 0;

  return {
    setup: {
      category,
      setCategory,
      pairCount,
      setPairCount,
      availablePairs,
      categoryDropdownCategories,
      startRound,
    },
    game: {
      phase,
      setPhase,
      pairs: gameplay.pairs,
      cards: gameplay.cards,
      matchedIds: gameplay.matchedIds,
      selectedCardIds: gameplay.selectedCardIds,
      wrongCardIds: gameplay.wrongCardIds,
      isResolving: gameplay.isResolving,
      moves: gameplay.moves,
      score: gameplay.score,
      feedback: gameplay.feedback,
      pairById,
      matchedLabel,
      progressPercent,
      selectCard,
    },
    session: {
      elapsedSeconds: session.elapsedSeconds,
      saveState: session.saveState,
      saveError: session.saveError,
      retrySave: session.retrySave,
    },
  };
}

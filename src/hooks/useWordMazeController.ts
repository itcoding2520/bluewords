import { useMemo, useState } from "react";
import type { VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { useVocabularyDropdownCategories } from "@/hooks/useVocabularyDropdownCategories";
import { useGameSessionTracking } from "@/hooks/useGameSessionTracking";
import { buildWordMazeRound } from "@/lib/word-maze";
import { useWordMazeGameplay } from "@/hooks/useWordMazeGameplay";
import { getPrimaryVocabularyMeaning } from "@/lib/vocabulary/meaning";
import { matchesVocabularyCategory } from "@/lib/vocabulary/category-filter";

type Phase = "setup" | "playing" | "results";
export type { MazeWord } from "@/lib/word-maze";

export function useWordMazeController(input: {
  words: VocabularyWord[];
  categories: VocabularyCategoryRow[];
  isAuthenticated: boolean;
}) {
  const { words, categories, isAuthenticated } = input;
  const [category, setCategory] = useState("all");
  const [phase, setPhase] = useState<Phase>("setup");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const gameplay = useWordMazeGameplay();
  const session = useGameSessionTracking({
    isAuthenticated,
    isPlaying: phase === "playing",
    shouldSubmit: phase === "results" && gameplay.won,
    gameType: "word-maze",
    roundSize: gameplay.round.length,
    score: gameplay.score,
    correctCount: gameplay.round.length,
    moves: gameplay.moves,
    startedAt,
  });

  const candidates = useMemo(() => {
    const meanings = new Set<string>();
    const result: VocabularyWord[] = [];
    for (const word of words) {
      const meaning = getPrimaryVocabularyMeaning(word);
      const key = meaning.toLocaleLowerCase();
      if (!meaning || !matchesVocabularyCategory(word.category, category) || meanings.has(key)) continue;
      meanings.add(key);
      result.push(word);
    }
    return result;
  }, [category, words]);
  const categoryDropdownCategories = useVocabularyDropdownCategories(categories, words, true);
  function startGame() {
    const nextRound = buildWordMazeRound(words, category);
    if (nextRound.length < 5 || nextRound.some((question) => question.choices.length < 4)) return;
    gameplay.startRound(nextRound);
    session.resetSession();
    setStartedAt(Date.now());
    setPhase("playing");
  }

  function chooseAnswer(choice: string) {
    if (gameplay.chooseAnswer(choice)) setPhase("results");
  }

  function continuePath() {
    if (gameplay.continuePath()) setPhase("results");
  }

  return {
    setup: {
      category,
      setCategory,
      candidates,
      categoryDropdownCategories,
      startGame,
    },
    game: {
      phase,
      setPhase,
      round: gameplay.round,
      questionIndex: gameplay.questionIndex,
      score: gameplay.score,
      lives: gameplay.lives,
      feedback: gameplay.feedback,
      selectedChoice: gameplay.selectedChoice,
      won: gameplay.won,
      current: gameplay.current,
      pathProgress: gameplay.pathProgress,
      solvedCount: gameplay.solvedCount,
      chooseAnswer,
      continuePath,
    },
    session: {
      elapsedSeconds: session.elapsedSeconds,
      saveState: session.saveState,
      saveError: session.saveError,
      retrySave: session.retrySave,
    },
  };
}

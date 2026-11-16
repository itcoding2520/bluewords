import type { GamePhase } from "@/types/game";
import { useState } from "react";
import type { VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { useGameSessionTracking } from "@/hooks/useGameSessionTracking";
import { buildWordMazeRound, WORD_MAZE_QUESTION_COUNT } from "@/lib/word-maze";
import { useWordMazeGameplay } from "@/hooks/useWordMazeGameplay";
import { useWordMazeSetupData } from "@/hooks/useWordMazeSetupData";

type Phase = GamePhase;
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

  const { candidates, categoryDropdownCategories } = useWordMazeSetupData({
    words,
    categories,
    category,
  });
  function startGame() {
    const nextRound = buildWordMazeRound(words, category);
    if (nextRound.length < WORD_MAZE_QUESTION_COUNT || nextRound.some((question) => question.choices.length < 4)) return;
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
      progress: gameplay.progress,
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

import type { GamePhase } from "@/types/game";
import { useState } from "react";
import type { VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { useGameSessionTracking } from "@/hooks/useGameSessionTracking";
import { useWordScrambleGameplay } from "@/hooks/useWordScrambleGameplay";
import { shuffleRoundIfAvailable } from "@/lib/random";
import { formatGameDuration } from "@/lib/game-duration";
import { getElapsedSeconds } from "@/lib/session-duration";
import { useWordScrambleSetupData } from "@/hooks/useWordScrambleSetupData";

export type { ScrambleWord, LetterTile } from "@/lib/word-scramble";

type Phase = GamePhase;
type QuestionCount = 5 | 10;

export function useWordScrambleController(input: {
  words: VocabularyWord[];
  categories: VocabularyCategoryRow[];
  isAuthenticated: boolean;
}) {
  const { words, categories, isAuthenticated } = input;
  const [category, setCategory] = useState("all");
  const [questionCount, setQuestionCount] = useState<QuestionCount>(10);
  const [phase, setPhase] = useState<Phase>("setup");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const gameplay = useWordScrambleGameplay();
  const session = useGameSessionTracking({
    isAuthenticated,
    isPlaying: phase === "playing",
    shouldSubmit: phase === "results",
    gameType: "word-scramble",
    roundSize: gameplay.round.length,
    score: gameplay.score,
    correctCount: gameplay.round.length,
    moves: gameplay.moves,
    startedAt,
  });

  const { candidates, categoryDropdownCategories } = useWordScrambleSetupData({
    words,
    categories,
    category,
  });
  const timeLabel = formatGameDuration(session.elapsedSeconds);

  function startRound() {
    const nextRound = shuffleRoundIfAvailable(candidates, questionCount);
    if (!nextRound) return;
    gameplay.startRound(nextRound);
    session.resetSession();
    setStartedAt(Date.now());
    setPhase("playing");
  }

  function nextQuestion() {
    if (!gameplay.nextQuestion()) return;
    session.setElapsedSeconds(startedAt === null
      ? 0
      : getElapsedSeconds(startedAt));
    setPhase("results");
  }

  return {
    setup: {
      category,
      setCategory,
      questionCount,
      setQuestionCount,
      candidates,
      categoryDropdownCategories,
      startRound,
    },
    game: {
      phase,
      round: gameplay.round,
      questionIndex: gameplay.questionIndex,
      letterTiles: gameplay.letterTiles,
      answerTileIds: gameplay.answerTileIds,
      score: gameplay.score,
      streak: gameplay.streak,
      bestStreak: gameplay.bestStreak,
      hintsLeft: gameplay.hintsLeft,
      hintUsed: gameplay.hintUsed,
      feedback: gameplay.feedback,
      isCorrect: gameplay.isCorrect,
      currentWord: gameplay.currentWord,
      usedTileIds: gameplay.usedTileIds,
      lettersByTileId: gameplay.lettersByTileId,
      chooseLetter: gameplay.chooseLetter,
      removeLetter: gameplay.removeLetter,
      useHint: gameplay.useHint,
      nextQuestion,
    },
    session: {
      timeLabel,
      saveState: session.saveState,
      saveError: session.saveError,
      retrySave: session.retrySave,
    },
  };
}

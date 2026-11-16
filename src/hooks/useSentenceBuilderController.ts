import type { GamePhase } from "@/types/game";
import { useState } from "react";
import { useElapsedTimer } from "@/hooks/useElapsedTimer";
import { useVocabulary } from "@/contexts/VocabularyContext";
import { useConfirmDialog } from "@/contexts/confirm-dialog";
import { formatGameDuration } from "@/lib/game-duration";
import { shuffle } from "@/lib/random";
import type { SentenceDifficulty } from "@/lib/sentence-builder";
import { useSentenceBuilderGameplay } from "@/hooks/useSentenceBuilderGameplay";
import { useSentenceBuilderSetupData } from "@/hooks/useSentenceBuilderSetupData";
import { useSentenceBuilderResultSave } from "@/hooks/useSentenceBuilderResultSave";

type Phase = GamePhase;
export type { SentenceBuilderTile } from "@/lib/sentence-builder";
export const sentenceBuilderQuestionCounts = [5, 10] as const;

export function useSentenceBuilderController() {
  const { isAuthenticated, categories: vocabularyCategories, words } = useVocabulary();
  const confirm = useConfirmDialog();
  const [difficulty, setDifficulty] = useState<SentenceDifficulty>("easy");
  const [category, setCategory] = useState("all");
  const [questionCount, setQuestionCount] = useState<5 | 10>(5);
  const [phase, setPhase] = useState<Phase>("setup");
  const gameplay = useSentenceBuilderGameplay();
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const { elapsedSeconds: seconds, setElapsedSeconds: setSeconds } = useElapsedTimer(startedAt, phase === "playing");
  const { loading, eligible, categories } = useSentenceBuilderSetupData({
    vocabularyCategories,
    difficulty,
    category,
  });
  const elapsed = formatGameDuration(seconds);
  const resultSave = useSentenceBuilderResultSave({
    isAuthenticated,
    phase,
    startedAt,
    roundSize: gameplay.round.length,
    score: gameplay.score,
    correctCount: gameplay.correctCount,
    moves: gameplay.moves,
    durationSeconds: seconds,
  });

  function start() {
    if (eligible.length < questionCount) return;
    const next = shuffle(eligible).slice(0, questionCount);
    gameplay.startRound(next);
    setStartedAt(Date.now()); setSeconds(0); resultSave.resetSaveState(); setPhase("playing");
  }

  function nextQuestion() {
    if (gameplay.nextQuestion()) setPhase("results");
  }

  async function exit() {
    if (phase === "playing" && !await confirm({ title: "Exit this round?", description: "Your current progress will be lost.", confirmLabel: "Exit", destructive: false })) return;
    setPhase("setup");
  }

  return {
    session: { isAuthenticated, loading, saveState: resultSave.saveState, elapsed },
    setup: {
      words,
      difficulty,
      setDifficulty,
      category,
      setCategory,
      questionCount,
      setQuestionCount,
      eligible,
      categories,
      start,
    },
    game: {
      phase,
      setPhase,
      round: gameplay.round,
      index: gameplay.index,
      tiles: gameplay.tiles,
      chosen: gameplay.chosen,
      score: gameplay.score,
      correctCount: gameplay.correctCount,
      hints: gameplay.hints,
      feedback: gameplay.feedback,
      solved: gameplay.solved,
      current: gameplay.current,
      choose: gameplay.choose,
      removeTile: gameplay.removeTile,
      removeLastTile: gameplay.removeLastTile,
      submit: gameplay.submit,
      useHint: gameplay.useHint,
      nextQuestion,
      exit,
    },
  };
}

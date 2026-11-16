import type { GamePhase } from "@/types/game";
import { useEffect, useMemo, useRef, useState } from "react";
import { useElapsedTimer } from "@/hooks/useElapsedTimer";
import { useVocabulary } from "@/contexts/VocabularyContext";
import { useConfirmDialog } from "@/contexts/confirm-dialog";
import { formatGameDuration } from "@/lib/game-duration";
import { shuffle } from "@/lib/random";
import { saveVocabularyGameSession } from "@/lib/supabase/game-leaderboard";
import { loadSentenceBuilderQuestions } from "@/lib/supabase/sentence-builder";
import type { SentenceBuilderQuestion, SentenceDifficulty } from "@/lib/sentence-builder";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { useSentenceBuilderGameplay } from "@/hooks/useSentenceBuilderGameplay";

type Phase = GamePhase;
export type { SentenceBuilderTile } from "@/lib/sentence-builder";
export const sentenceBuilderQuestionCounts = [5, 10] as const;

export function useSentenceBuilderController() {
  const { isAuthenticated, categories: vocabularyCategories, words } = useVocabulary();
  const confirm = useConfirmDialog();
  const [questions, setQuestions] = useState<SentenceBuilderQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState<SentenceDifficulty>("easy");
  const [category, setCategory] = useState("all");
  const [questionCount, setQuestionCount] = useState<5 | 10>(5);
  const [phase, setPhase] = useState<Phase>("setup");
  const gameplay = useSentenceBuilderGameplay();
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const { elapsedSeconds: seconds, setElapsedSeconds: setSeconds } = useElapsedTimer(startedAt, phase === "playing");
  const [saveState, setSaveState] = useState("");
  const saveOnce = useRef(false);

  const eligible = useMemo(
    () => questions.filter((question) => question.difficulty === difficulty && (category === "all" || question.category.toLocaleLowerCase() === category.toLocaleLowerCase())),
    [questions, difficulty, category],
  );
  const categories = useMemo(() => {
    const names = [...new Set(questions.filter((question) => question.difficulty === difficulty).map((question) => question.category))].sort((a, b) => a.localeCompare(b));
    return names.map((name): VocabularyCategoryRow => vocabularyCategories.find((item) => item.name.toLocaleLowerCase() === name.toLocaleLowerCase()) ?? {
      id: `sentence-builder-${name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-")}`, user_id: "", name, color: "blue", image_path: null, is_default: true, created_at: "", updated_at: "",
    });
  }, [difficulty, questions, vocabularyCategories]);
  const elapsed = formatGameDuration(seconds);

  useEffect(() => {
    let active = true;
    void loadSentenceBuilderQuestions().then((data) => { if (active) setQuestions(data); }).catch(() => { if (active) setQuestions([]); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || phase !== "results" || startedAt === null || saveOnce.current) return;
    saveOnce.current = true;
    setSaveState("Saving result…");
    void saveVocabularyGameSession({ gameType: "sentence-builder", roundSize: gameplay.round.length, score: gameplay.score, correctCount: gameplay.correctCount, moves: Math.max(gameplay.moves, gameplay.correctCount), durationSeconds: seconds, startedAt: new Date(startedAt).toISOString(), completedAt: new Date().toISOString() })
      .then(() => setSaveState("Result saved to the leaderboard."))
      .catch(() => setSaveState("Could not save your leaderboard result."));
  }, [gameplay.correctCount, gameplay.moves, gameplay.round.length, gameplay.score, isAuthenticated, phase, seconds, startedAt]);

  function start() {
    if (eligible.length < questionCount) return;
    const next = shuffle(eligible).slice(0, questionCount);
    gameplay.startRound(next);
    setStartedAt(Date.now()); setSeconds(0); saveOnce.current = false; setSaveState(""); setPhase("playing");
  }

  function nextQuestion() {
    if (gameplay.nextQuestion()) setPhase("results");
  }

  async function exit() {
    if (phase === "playing" && !await confirm({ title: "Exit this round?", description: "Your current progress will be lost.", confirmLabel: "Exit", destructive: false })) return;
    setPhase("setup");
  }

  return {
    session: { isAuthenticated, loading, saveState, elapsed },
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

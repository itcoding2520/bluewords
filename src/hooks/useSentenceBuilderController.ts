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

type Phase = "setup" | "playing" | "results";
export type SentenceBuilderTile = { id: number; text: string };
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
  const [round, setRound] = useState<SentenceBuilderQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [tiles, setTiles] = useState<SentenceBuilderTile[]>([]);
  const [chosen, setChosen] = useState<SentenceBuilderTile[]>([]);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [moves, setMoves] = useState(0);
  const [hints, setHints] = useState(3);
  const [feedback, setFeedback] = useState("");
  const [solved, setSolved] = useState(false);
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
  const current = round[index];
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
    void saveVocabularyGameSession({ gameType: "sentence-builder", roundSize: round.length, score, correctCount, moves: Math.max(moves, correctCount), durationSeconds: seconds, startedAt: new Date(startedAt).toISOString(), completedAt: new Date().toISOString() })
      .then(() => setSaveState("Result saved to the leaderboard."))
      .catch(() => setSaveState("Could not save your leaderboard result."));
  }, [correctCount, isAuthenticated, moves, phase, round.length, score, seconds, startedAt]);

  function start() {
    if (eligible.length < questionCount) return;
    const next = shuffle(eligible).slice(0, questionCount);
    setRound(next); setIndex(0); setChosen([]); setTiles(shuffle([...next[0].answer_tokens, ...next[0].distractor_tokens].map((text, id) => ({ id, text }))));
    setScore(0); setCorrectCount(0); setMoves(0); setHints(3); setFeedback(""); setSolved(false); setStartedAt(Date.now()); setSeconds(0); saveOnce.current = false; setSaveState(""); setPhase("playing");
  }

  function choose(tile: SentenceBuilderTile) {
    if (solved || chosen.some((item) => item.id === tile.id)) return;
    setChosen((previous) => [...previous, tile]); setFeedback("");
  }

  function removeTile(tileId: number) {
    setChosen((previous) => previous.filter((tile) => tile.id !== tileId));
    setFeedback("");
  }

  function removeLastTile() {
    setChosen((previous) => previous.slice(0, -1));
    setFeedback("");
  }

  function submit() {
    if (!current || solved || !chosen.length) return;
    setMoves((value) => value + 1);
    const answer = chosen.map((tile) => tile.text).join(" ");
    if (answer === current.answer_tokens.join(" ")) { setScore((value) => value + 10); setCorrectCount((value) => value + 1); setFeedback("Perfect sentence! Great job!"); setSolved(true); }
    else setFeedback("Not quite. Try a different word order.");
  }

  function useHint() {
    if (!current || solved || hints < 1) return;
    const expected = current.answer_tokens[chosen.length];
    const tile = tiles.find((item) => item.text === expected && !chosen.some((picked) => picked.id === item.id));
    if (!tile) return;
    setChosen((previous) => [...previous, tile]); setHints((count) => count - 1); setFeedback("Hint added the next word tile.");
  }

  function nextQuestion() {
    if (index + 1 >= round.length) { setPhase("results"); return; }
    const nextIndex = index + 1;
    setIndex(nextIndex); setChosen([]); setTiles(shuffle([...round[nextIndex].answer_tokens, ...round[nextIndex].distractor_tokens].map((text, id) => ({ id, text })))); setFeedback(""); setSolved(false);
  }

  async function exit() {
    if (phase === "playing" && !await confirm({ title: "Exit this round?", description: "Your current progress will be lost.", confirmLabel: "Exit", destructive: false })) return;
    setPhase("setup");
  }

  return {
    isAuthenticated, words, loading, difficulty, setDifficulty, category, setCategory, questionCount, setQuestionCount,
    phase, setPhase, round, index, tiles, chosen, setChosen, score, correctCount, hints, feedback, solved,
    saveState, eligible, categories, current, elapsed, start, choose, removeTile, removeLastTile, submit, useHint, nextQuestion, exit,
  };
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Clock3, Lightbulb, RotateCcw, Sparkles, Star, Trophy, Undo2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useVocabulary } from "@/contexts/VocabularyContext";
import { useVocabularyImageUrl } from "@/hooks/useVocabularyImageUrl";
import { CategoryDropdown } from "@/components/vocabulary/VocabularyToolbar";
import { saveVocabularyGameSession } from "@/lib/supabase/game-leaderboard";
import { loadSentenceBuilderQuestions, type SentenceBuilderQuestion, type SentenceDifficulty } from "@/lib/supabase/sentence-builder";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { useConfirmDialog } from "@/components/ui/ConfirmDialogProvider";
import Image from "next/image";

type Phase = "setup" | "playing" | "results";
type Tile = { id: number; text: string };
const counts = [5, 10] as const;
const icons: Record<string, string> = { apple: "🍎", banana: "🍌", cat: "🐱", dog: "🐶", book: "📚", sun: "☀️", water: "💧", milk: "🥛", ball: "⚽", girl: "👧", boy: "👦", school: "🏫", flower: "🌸", bird: "🐦", fish: "🐟", car: "🚗", tree: "🌳" };
function shuffle<T>(items: T[]): T[] { const copy = [...items]; for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; } return copy; }
function SentencePicture({ keyword, questionId }: { keyword: string; questionId: string }) {
  const { words } = useVocabulary();
  const word = words.find((item) => item.word.toLocaleLowerCase() === keyword.toLocaleLowerCase());
  const imageUrl = useVocabularyImageUrl(word?.imagePath ?? null);
  const [failed, setFailed] = useState(false);
  return <div className="sentence-builder-picture">{imageUrl && !failed ? <Image key={questionId} src={imageUrl} alt={`Picture clue: ${keyword}`} fill unoptimized sizes="(max-width: 700px) 90vw, 28rem" onError={() => setFailed(true)} /> : <span aria-label={keyword}>{icons[keyword.toLowerCase()] ?? "🖼️"}</span>}</div>;
}

export function SentenceBuilderContent() {
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
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [chosen, setChosen] = useState<Tile[]>([]);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [moves, setMoves] = useState(0);
  const [hints, setHints] = useState(3);
  const [feedback, setFeedback] = useState("");
  const [solved, setSolved] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [saveState, setSaveState] = useState("");
  const saveOnce = useRef(false);
  const eligible = useMemo(() => questions.filter((q) => q.difficulty === difficulty && (category === "all" || q.category.toLocaleLowerCase() === category.toLocaleLowerCase())), [questions, difficulty, category]);
  const categories = useMemo(() => {
    const questionCategories = [...new Set(questions.filter((question) => question.difficulty === difficulty).map((question) => question.category))].sort((a, b) => a.localeCompare(b));
    return questionCategories.map((name): VocabularyCategoryRow => vocabularyCategories.find((item) => item.name.toLocaleLowerCase() === name.toLocaleLowerCase()) ?? {
      id: `sentence-builder-${name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-")}`, user_id: "", name, color: "blue", image_path: null, is_default: true, created_at: "", updated_at: "",
    });
  }, [difficulty, questions, vocabularyCategories]);
  const current = round[index];
  const elapsed = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  useEffect(() => { let active = true; void loadSentenceBuilderQuestions().then((data) => { if (active) setQuestions(data); }).catch(() => { if (active) setQuestions([]); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  useEffect(() => { if (phase !== "playing" || startedAt === null) return; const tick = () => setSeconds(Math.floor((Date.now() - startedAt) / 1000)); tick(); const timer = window.setInterval(tick, 1000); return () => window.clearInterval(timer); }, [phase, startedAt]);
  useEffect(() => {
    if (!isAuthenticated || phase !== "results" || startedAt === null || saveOnce.current) return;
    saveOnce.current = true; setSaveState("Saving result…");
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
  function choose(tile: Tile) { if (solved || chosen.some((item) => item.id === tile.id)) return; setChosen((prev) => [...prev, tile]); setFeedback(""); }
  function submit() {
    if (!current || solved || !chosen.length) return;
    setMoves((value) => value + 1);
    const answer = chosen.map((tile) => tile.text).join(" ");
    if (answer === current.answer_tokens.join(" ")) { setScore((value) => value + 10); setCorrectCount((value) => value + 1); setFeedback("Perfect sentence! Great job!"); setSolved(true); }
    else setFeedback("Not quite. Try a different word order.");
  }
  function useHint() {
    if (!current || solved || hints < 1) return;
    const nextIndex = chosen.length;
    const expected = current.answer_tokens[nextIndex];
    const tile = tiles.find((item) => item.text === expected && !chosen.some((picked) => picked.id === item.id));
    if (!tile) return;
    setChosen((prev) => [...prev, tile]); setHints((count) => count - 1); setFeedback("Hint added the next word tile.");
  }
  function nextQuestion() {
    if (index + 1 >= round.length) { setPhase("results"); return; }
    const nextIndex = index + 1; setIndex(nextIndex); setChosen([]); setTiles(shuffle([...round[nextIndex].answer_tokens, ...round[nextIndex].distractor_tokens].map((text, id) => ({ id, text })))); setFeedback(""); setSolved(false);
  }
  async function exit() { if (phase === "playing" && !await confirm({ title: "Exit this round?", description: "Your current progress will be lost.", confirmLabel: "Exit", destructive: false })) return; setPhase("setup"); }

  if (loading) return <p className="py-16 text-center text-slate-500">Loading Sentence Builder…</p>;
  return <main className="sentence-builder-page">
    <Link href="/games" className="word-scramble-back"><ArrowLeft size={17}/> Back to Games</Link>
    <header className="sentence-builder-hero"><span>Vocabulary game</span><h1>Sentence <b>Builder</b> ✨</h1><p>Put the words in order to make a sentence!</p></header>
    {phase === "setup" ? <div className="sentence-builder-setup">
      <Card className="sentence-builder-panel"><div className="sentence-builder-panel-title"><span>🧩</span><div><h2>Build a sentence</h2><p>Use the picture and Vietnamese clue to arrange the word tiles.</p></div></div>
        <label htmlFor="sentence-builder-difficulty">Difficulty</label><select id="sentence-builder-difficulty" className="sentence-builder-difficulty-select" value={difficulty} onChange={(e) => { setDifficulty(e.target.value as SentenceDifficulty); setCategory("all"); }}><option value="easy">Easy · Dễ</option><option value="medium">Medium · Trung bình</option><option value="hard">Hard · Khó</option></select>
        <label className="sentence-builder-category-label" htmlFor="sentence-builder-category">Category</label><CategoryDropdown id="sentence-builder-category" ariaLabel="Sentence category" category={category} categories={categories} words={words} onChange={setCategory} includeAll fullWidth />
        <fieldset><legend>Questions per round</legend><div className="sentence-builder-counts">{counts.map((count) => <button key={count} type="button" aria-pressed={count === questionCount} disabled={eligible.length < count} className={count === questionCount ? "is-selected" : ""} onClick={() => setQuestionCount(count)}>{count} questions</button>)}</div></fieldset>
        <p className="sentence-builder-availability">{eligible.length} questions available at this level.</p>
        {eligible.length < 5 && <p className="sentence-builder-empty">There are not enough active questions here yet. Try another level or category.</p>}
        <button className="sentence-builder-primary" type="button" disabled={eligible.length < questionCount} onClick={start}><Sparkles size={19}/> Start game <ArrowRight size={19}/></button>
      </Card><Card className="sentence-builder-howto"><span>💡</span><h2>How to play</h2><p>Tap each word tile in sentence order, then check your sentence. Correct answers earn 10 points. Hints reveal one word.</p><strong><Star size={17} fill="currentColor"/> 10 points per correct sentence</strong></Card>
    </div> : phase === "playing" && current ? <Card className="sentence-builder-game">
      <div className="sentence-builder-stats"><button type="button" onClick={() => void exit()}><ArrowLeft size={16}/> Exit round</button><span>Question {index + 1} of {round.length}</span><b><Star size={18} fill="currentColor"/> {score} points</b><b><Clock3 size={17}/> {elapsed}</b></div>
      <div className="sentence-builder-progress"><i style={{ width: `${((index + 1) / round.length) * 100}%` }}/></div>
      <div className="sentence-builder-question"><SentencePicture keyword={current.image_keyword} questionId={current.id}/><section><h2>Build the sentence</h2><p className="sentence-builder-clue"><Lightbulb size={20}/> {current.prompt_vi}</p><div className="sentence-builder-answer" aria-label="Your sentence">{chosen.length ? chosen.map((tile) => <button key={tile.id} type="button" disabled={solved} onClick={() => { setChosen((prev) => prev.filter((item) => item.id !== tile.id)); setFeedback(""); }}>{tile.text}</button>) : <span>Choose word tiles below</span>}</div><div className="sentence-builder-feedback" aria-live="polite">{feedback}</div></section></div>
      <div className="sentence-builder-tiles" aria-label="Available word tiles">{tiles.map((tile) => <button type="button" key={tile.id} disabled={solved || chosen.some((item) => item.id === tile.id)} onClick={() => choose(tile)}>{tile.text}</button>)}</div>
      <div className="sentence-builder-actions"><button type="button" className="sentence-builder-hint" disabled={solved || hints === 0} onClick={useHint}><Lightbulb size={18}/> Hint <small>{hints}</small></button><button type="button" className="sentence-builder-remove" disabled={solved || chosen.length === 0} onClick={() => { setChosen((prev) => prev.slice(0, -1)); setFeedback(""); }}><Undo2 size={18}/> Remove last word</button>{solved ? <button type="button" className="sentence-builder-primary" onClick={nextQuestion}>{index + 1 === round.length ? "Finish round" : "Next sentence"}<ArrowRight size={18}/></button> : <button type="button" className="sentence-builder-primary" disabled={!chosen.length} onClick={submit}><Check size={18}/> Check sentence</button>}</div>
    </Card> : <Card className="sentence-builder-results"><span><Trophy size={38}/></span><p>ROUND COMPLETE</p><h2>Sentence superstar!</h2><strong>{score} <small>points</small></strong><div><span>{correctCount}/{round.length} correct</span><span>{elapsed}</span></div><p className="sentence-builder-save">{isAuthenticated ? saveState : "Sign in to save scores to the leaderboard."}</p><button type="button" className="sentence-builder-primary" onClick={() => setPhase("setup")}><RotateCcw size={18}/> Play again</button></Card>}
  </main>;
}

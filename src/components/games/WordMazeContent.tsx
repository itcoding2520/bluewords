"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Clock3, Flag, Heart, Map, RotateCcw, ShieldAlert, Sparkles, Star } from "lucide-react";

import { useVocabulary } from "@/contexts/VocabularyContext";
import type { VocabularyWord } from "@/data/vocabulary";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { PronunciationButton } from "@/components/vocabulary/PronunciationButton";
import { saveVocabularyGameSession } from "@/lib/supabase/game-leaderboard";

type Phase = "setup" | "playing" | "results";
type MazeWord = { id: string; word: string; meaning: string; category: string; choices: string[] };

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function getMeaning(word: VocabularyWord) {
  return word.detailedMeanings?.find((item) => item.meaning.trim())?.meaning.trim() || word.meaning.trim();
}

function makeRound(words: VocabularyWord[], category: string): MazeWord[] {
  const seenWords = new Set<string>();
  const seenMeanings = new Set<string>();
  const available = words.flatMap((word) => {
    const text = word.word.trim();
    const meaning = getMeaning(word);
    const meaningKey = meaning.toLocaleLowerCase();
    if (!text || !meaning || (category !== "all" && word.category !== category) || seenWords.has(text.toLocaleLowerCase()) || seenMeanings.has(meaningKey)) return [];
    seenWords.add(text.toLocaleLowerCase());
    seenMeanings.add(meaningKey);
    return [{ id: word.id, word: text, meaning, category: word.category }];
  });
  const chosen = shuffle(available).slice(0, 5);
  return chosen.map((answer) => {
    const distractors = shuffle(available.filter((word) => word.id !== answer.id && word.meaning.toLocaleLowerCase() !== answer.meaning.toLocaleLowerCase()))
      .slice(0, 3)
      .map((word) => word.meaning);
    return { ...answer, choices: shuffle([answer.meaning, ...distractors]) };
  });
}

const pathNodes = [
  { x: 9, y: 77 },
  { x: 25, y: 67 },
  { x: 40, y: 76 },
  { x: 55, y: 60 },
  { x: 69, y: 67 },
  { x: 83, y: 43 },
];

function MazeMap({ progress, feedback }: { progress: number; feedback: "correct" | "wrong" | null }) {
  const mascot = pathNodes[Math.min(progress, pathNodes.length - 1)];
  return (
    <section className="word-maze-map" aria-label={`Maze progress: ${progress} of 5 paths opened`}>
      <div className="word-maze-map-sky" />
      <div className="word-maze-mountain">⛰️</div>
      <div className="word-maze-forest word-maze-forest-one">🌲 🌳 🌲</div>
      <div className="word-maze-forest word-maze-forest-two">🌳 🌲 🌳</div>
      <svg className="word-maze-route" viewBox="0 0 600 380" role="img" aria-label="A winding trail through the maze toward the finish flag">
        <path d="M55 292 C95 300 118 248 153 253 S220 319 260 288 S315 217 336 211 S385 260 426 223 S466 149 504 151" pathLength="100" className="word-maze-road" />
        <path d="M55 292 C95 300 118 248 153 253 S220 319 260 288 S315 217 336 211 S385 260 426 223 S466 149 504 151" pathLength="100" className="word-maze-road-open" style={{ strokeDashoffset: `${100 - Math.min(progress, 5) * 20}%` }} />
        {pathNodes.slice(0, 6).map((node, index) => <circle key={index} cx={node.x * 6} cy={node.y * 3.8} r="13" className={`word-maze-node ${index <= progress ? "is-open" : ""} ${index === progress ? "is-current" : ""}`} />)}
      </svg>
      <div className={`word-maze-mascot ${feedback === "wrong" ? "is-worried" : ""}`} style={{ left: `${mascot.x}%`, top: `${mascot.y}%` }} aria-hidden="true">📘</div>
      <span className="word-maze-start-sign">START</span>
      <span className="word-maze-finish-sign"><Flag size={18} fill="currentColor" /> FINISH</span>
      <span className="word-maze-rock" aria-hidden="true">🪨</span>
      <p className="word-maze-map-caption"><Map size={16} /> Open the right path to reach the finish!</p>
    </section>
  );
}

export function WordMazeContent() {
  const { words, categories, isLoaded, isAuthenticated } = useVocabulary();
  const [category, setCategory] = useState("all");
  const [phase, setPhase] = useState<Phase>("setup");
  const [round, setRound] = useState<MazeWord[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [won, setWon] = useState(false);
  const [moves, setMoves] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState("");
  const [saveRetryCount, setSaveRetryCount] = useState(0);
  const saveStartedRef = useRef<number | null>(null);

  useEffect(() => {
    if (phase !== "playing" || startedAt === null) return;
    const updateClock = () => setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    updateClock();
    const interval = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(interval);
  }, [phase, startedAt]);

  useEffect(() => {
    if (!isAuthenticated || phase !== "results" || !won || startedAt === null || saveStartedRef.current === startedAt) return;
    saveStartedRef.current = startedAt;
    const completedAt = Date.now();
    const durationSeconds = Math.max(0, Math.floor((completedAt - startedAt) / 1000));
    setElapsedSeconds(durationSeconds);
    setSaveState("saving");
    setSaveError("");
    void saveVocabularyGameSession({
      gameType: "word-maze",
      roundSize: round.length,
      score,
      correctCount: round.length,
      moves,
      durationSeconds,
      startedAt: new Date(startedAt).toISOString(),
      completedAt: new Date(completedAt).toISOString(),
    }).then(() => setSaveState("saved")).catch((error: unknown) => {
      saveStartedRef.current = null;
      setSaveState("error");
      setSaveError(error instanceof Error ? error.message : "Could not save this result.");
    });
  }, [isAuthenticated, moves, phase, round.length, saveRetryCount, score, startedAt, won]);

  const candidates = useMemo(() => {
    const meanings = new Set<string>();
    const result: VocabularyWord[] = [];
    for (const word of words) {
      const meaning = getMeaning(word);
      const key = meaning.toLocaleLowerCase();
      if (!meaning || (category !== "all" && word.category !== category) || meanings.has(key)) continue;
      meanings.add(key);
      result.push(word);
    }
    return result;
  }, [category, words]);

  const categoryOptions = useMemo(() => ["all", ...new Set(categories.map((item) => item.name).filter(Boolean))], [categories]);
  const current = round[questionIndex];
  const pathProgress = questionIndex + (feedback === "correct" ? 1 : 0);
  const solvedCount = questionIndex + (feedback === "correct" ? 1 : 0);

  function startGame() {
    const nextRound = makeRound(words, category);
    if (nextRound.length < 5 || nextRound.some((question) => question.choices.length < 4)) return;
    setRound(nextRound);
    setQuestionIndex(0);
    setScore(0);
    setLives(3);
    setFeedback(null);
    setSelectedChoice(null);
    setWon(false);
    setMoves(0);
    setStartedAt(Date.now());
    setElapsedSeconds(0);
    setSaveState("idle");
    setSaveError("");
    saveStartedRef.current = null;
    setPhase("playing");
  }

  function chooseAnswer(choice: string) {
    if (!current || feedback === "correct" || selectedChoice === choice) return;
    setMoves((value) => value + 1);
    setSelectedChoice(choice);
    if (choice === current.meaning) {
      setScore((value) => value + 10);
      setFeedback("correct");
      return;
    }
    const remainingLives = lives - 1;
    setLives(remainingLives);
    setFeedback("wrong");
    if (remainingLives === 0) setPhase("results");
  }

  function continuePath() {
    if (questionIndex >= round.length - 1) {
      setWon(true);
      setPhase("results");
      return;
    }
    setQuestionIndex((index) => index + 1);
    setFeedback(null);
    setSelectedChoice(null);
  }

  if (!isLoaded) return <p className="py-16 text-center text-sm text-slate-500">Loading your vocabulary…</p>;

  return (
    <div className="word-maze-page">
      <Link href="/games" className="word-maze-back"><ArrowLeft size={17} /> Back to Games</Link>
      <header className="word-maze-hero">
        <span className="word-maze-hero-badge"><Map size={17} /> Vocabulary adventure</span>
        <h1>Word Maze <span>Adventure</span></h1>
        <p>Pick the right meaning to find your way!</p>
        <span className="word-maze-hero-mascot" aria-hidden="true">📘</span>
      </header>

      {phase === "setup" ? (
        <div className="word-maze-setup">
          <Card className="word-maze-setup-card">
            <div className="word-maze-setup-icon"><Map size={28} /></div>
            <div className="word-maze-setup-copy"><h2>Ready for an adventure?</h2><p>Answer five meaning questions to open the path. You have three lives for the journey.</p></div>
            <label htmlFor="word-maze-category">Choose a category</label>
            <Select id="word-maze-category" containerClassName="word-maze-category-select" className="word-maze-category-select-control" value={category} onChange={(event) => setCategory(event.target.value)}>
              {categoryOptions.map((option) => <option key={option} value={option}>{option === "all" ? "All categories" : option}</option>)}
            </Select>
            <p className="word-maze-availability">{candidates.length} words ready for the maze</p>
            {candidates.length < 5 && <p className="word-maze-warning" role="status">Add at least five words with different meanings to start this adventure.</p>}
            <button type="button" className="word-maze-primary" disabled={candidates.length < 5} onClick={startGame}><Map size={20} /> Start adventure <ArrowRight size={20} /></button>
          </Card>
          <Card className="word-maze-howto"><span className="word-maze-howto-icon"><Sparkles size={24} /></span><h2>How to play</h2><p>Choose the correct meaning to move your mascot along the glowing path. A wrong answer costs one life, but you can try the question again.</p><div className="word-maze-howto-stats"><span><Star size={18} fill="currentColor" /> +10 <small>points</small></span><span><Heart size={18} fill="currentColor" /> 3 <small>lives</small></span></div></Card>
        </div>
      ) : phase === "playing" && current ? (
        <div className="word-maze-game-layout">
          <MazeMap progress={pathProgress} feedback={feedback} />
          <Card className="word-maze-question-card">
            <div className="word-maze-stats">
              <span><Flag size={18} /> Level <strong>{questionIndex + 1}/5</strong></span>
              <span className="word-maze-stars" aria-label={`${Math.floor(score / 10)} of 5 stars`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={21} fill={score / 10 > index ? "currentColor" : "none"} />)}</span>
              <span><Map size={18} /> <strong>{questionIndex + 1}/5</strong><small>questions</small></span>
              <span className="word-maze-lives" aria-label={`${lives} lives remaining`}>{Array.from({ length: 3 }, (_, index) => <Heart key={index} size={21} fill={index < lives ? "currentColor" : "none"} />)}</span>
            </div>
            <div className="word-maze-question-heading"><PronunciationButton word={current.word} /><div><small>{current.category}</small><h2>What does “{current.word}” mean?</h2></div></div>
            <div className="word-maze-choices">
              {current.choices.map((choice) => {
                const isAnswer = choice === current.meaning;
                const isSelected = selectedChoice === choice;
                const status = feedback === "correct" && isAnswer ? "is-correct" : feedback === "wrong" && isSelected ? "is-wrong" : "";
                return <button key={choice} type="button" onClick={() => chooseAnswer(choice)} className={`word-maze-choice ${status}`} aria-pressed={isSelected}>
                  <span>{choice}</span>{feedback === "correct" && isAnswer && <Check size={21} />}{feedback === "wrong" && isSelected && <ShieldAlert size={20} />}
                </button>;
              })}
            </div>
            <div className={`word-maze-feedback ${feedback ?? ""}`} aria-live="polite">
              {feedback === "correct" ? <><span className="word-maze-feedback-mascot">📘</span><p><strong>Correct!</strong><span>Follow the glowing path!</span></p></> : feedback === "wrong" ? <><ShieldAlert size={22} /><p><strong>Not quite!</strong><span>{lives} {lives === 1 ? "life" : "lives"} left. Try another answer.</span></p></> : <><Sparkles size={22} /><p><strong>Choose the right meaning</strong><span>Your mascot is waiting for you!</span></p></>}
            </div>
            {feedback === "correct" && <button type="button" className="word-maze-primary word-maze-continue" onClick={continuePath}>{questionIndex === round.length - 1 ? "Reach the finish" : "Continue"} <ArrowRight size={22} /></button>}
          </Card>
        </div>
      ) : (
        <Card className={`word-maze-results ${won ? "is-won" : "is-lost"}`}>
          <span className="word-maze-result-mascot" aria-hidden="true">{won ? "🏆" : "📘"}</span>
          <p className="word-maze-hero-badge">{won ? "ADVENTURE COMPLETE" : "ADVENTURE PAUSED"}</p>
          <h2>{won ? "You found your way!" : "The path is still waiting"}</h2>
          <p>{won ? "Great job guiding your mascot through the maze." : "You ran out of lives. Try the maze again and keep exploring."}</p>
          <div className="word-maze-result-score"><Star size={22} fill="currentColor" /> {score} <small>points</small></div>
          <p className="word-maze-result-progress">{solvedCount} of {round.length} paths opened · {lives} lives left</p>
          <p className="word-maze-result-time"><Clock3 size={16} /> Completed in {Math.floor(elapsedSeconds / 60)}:{String(elapsedSeconds % 60).padStart(2, "0")}</p>
          {isAuthenticated && <p className={`word-match-save-state ${saveState}`} role="status">{saveState === "saving" ? "Saving your leaderboard result…" : saveState === "saved" ? "Result saved to the leaderboard." : saveState === "error" ? saveError : ""}{saveState === "error" && <button type="button" onClick={() => setSaveRetryCount((count) => count + 1)}>Try again</button>}</p>}
          <button type="button" className="word-maze-primary" onClick={startGame}><RotateCcw size={19} /> Play again</button>
        </Card>
      )}
    </div>
  );
}

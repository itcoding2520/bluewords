"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CaseSensitive, Check, Clock3, Delete, Lightbulb, RotateCcw, Sparkles, Star, Trophy } from "lucide-react";

import { useVocabulary } from "@/contexts/VocabularyContext";
import type { VocabularyWord } from "@/data/vocabulary";
import { useVocabularyImageUrl } from "@/hooks/useVocabularyImageUrl";
import { Card } from "@/components/ui/Card";
import { PronunciationButton } from "@/components/vocabulary/PronunciationButton";
import { saveVocabularyGameSession } from "@/lib/supabase/game-leaderboard";

type Phase = "setup" | "playing" | "results";
type ScrambleWord = { id: string; word: string; answer: string; meaning: string; category: string; imagePath: string | null; imageUrl: string | null };
type LetterTile = { id: number; letter: string };
const QUESTION_COUNTS = [5, 10] as const;

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function scramble(answer: string): LetterTile[] {
  const letters = [...answer].map((letter, id) => ({ id, letter }));
  let shuffled = shuffle(letters);
  let attempts = 0;
  while (shuffled.map(({ letter }) => letter).join("") === answer && attempts < 8) {
    shuffled = shuffle(letters);
    attempts += 1;
  }
  if (shuffled.map(({ letter }) => letter).join("") === answer && shuffled.length > 1) {
    const swapIndex = shuffled.findIndex((tile, index) => tile.letter !== shuffled[0].letter && index > 0);
    if (swapIndex > 0) [shuffled[0], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[0]];
  }
  return shuffled;
}

function getMeaning(word: VocabularyWord) {
  return word.detailedMeanings?.find((item) => item.meaning.trim())?.meaning.trim() || word.meaning.trim();
}

function ScrambleImage({ word }: { word: ScrambleWord }) {
  const signedUrl = useVocabularyImageUrl(word.imagePath);
  const url = word.imageUrl ?? signedUrl;
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(url) && !imageFailed;

  return (
    <div className="word-scramble-picture">
      {showImage ? <Image src={url!} alt={`Picture hint for ${word.word}`} fill unoptimized onError={() => setImageFailed(true)} sizes="(max-width: 700px) 90vw, 28rem" /> : <div className="word-scramble-picture-placeholder" aria-hidden="true"><CaseSensitive size={64} /><Sparkles size={20} /></div>}
    </div>
  );
}

export function WordScrambleContent() {
  const { words, categories, isLoaded, isAuthenticated } = useVocabulary();
  const [category, setCategory] = useState("all");
  const [questionCount, setQuestionCount] = useState<(typeof QUESTION_COUNTS)[number]>(10);
  const [phase, setPhase] = useState<Phase>("setup");
  const [round, setRound] = useState<ScrambleWord[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [letterTiles, setLetterTiles] = useState<LetterTile[]>([]);
  const [answerTileIds, setAnswerTileIds] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [moves, setMoves] = useState(0);
  const [hintsLeft, setHintsLeft] = useState(3);
  const [hintUsed, setHintUsed] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isCorrect, setIsCorrect] = useState(false);
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
    if (!isAuthenticated || phase !== "results" || startedAt === null || saveStartedRef.current === startedAt) return;
    saveStartedRef.current = startedAt;
    const completedAt = Date.now();
    const durationSeconds = Math.max(0, Math.floor((completedAt - startedAt) / 1000));
    setElapsedSeconds(durationSeconds);
    setSaveState("saving");
    setSaveError("");
    void saveVocabularyGameSession({
      gameType: "word-scramble",
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
  }, [isAuthenticated, moves, phase, round.length, saveRetryCount, score, startedAt]);

  const candidates = useMemo(() => {
    const seen = new Set<string>();
    return words.flatMap((word) => {
      const answer = word.word.trim().toLocaleLowerCase().replace(/[^a-z]/g, "");
      const meaning = getMeaning(word);
      if ((category !== "all" && word.category !== category) || answer.length < 3 || answer.length > 10 || !meaning || seen.has(answer)) return [];
      seen.add(answer);
      return [{ id: word.id, word: word.word.trim(), answer, meaning, category: word.category, imagePath: word.imagePath ?? null, imageUrl: word.imageUrl ?? null }];
    });
  }, [category, words]);

  const categoryOptions = useMemo(() => {
    const names = [...new Set([...categories.map((item) => item.name), ...words.map((word) => word.category)])]
      .filter((name) => name.trim() && name.trim().toLocaleLowerCase() !== "uncategorized")
      .sort((left, right) => left.localeCompare(right));
    return [{ value: "all", label: "All categories" }, ...names.map((name) => ({ value: name, label: name }))];
  }, [categories, words]);

  const currentWord = round[questionIndex];
  const usedTileIds = new Set(answerTileIds);
  const timeLabel = `${Math.floor(elapsedSeconds / 60)}:${String(elapsedSeconds % 60).padStart(2, "0")}`;

  function startRound() {
    if (candidates.length < questionCount) return;
    const nextRound = shuffle(candidates).slice(0, questionCount);
    setRound(nextRound);
    setQuestionIndex(0);
    setLetterTiles(scramble(nextRound[0].answer));
    setAnswerTileIds([]);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setMoves(0);
    setHintsLeft(3);
    setHintUsed(false);
    setFeedback("");
    setIsCorrect(false);
    setStartedAt(Date.now());
    saveStartedRef.current = null;
    setSaveState("idle");
    setSaveError("");
    setElapsedSeconds(0);
    setPhase("playing");
  }

  function submitAnswer(nextIds: number[], usedHint = hintUsed) {
    setMoves((count) => count + 1);
    const answer = nextIds.map((id) => letterTiles.find((tile) => tile.id === id)?.letter ?? "").join("");
    if (answer.length !== currentWord.answer.length) return;
    if (answer === currentWord.answer) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setBestStreak((best) => Math.max(best, nextStreak));
      setScore((value) => value + (usedHint ? 10 : 20));
      setFeedback(`Great job! ${currentWord.word} is correct!`);
      setIsCorrect(true);
    } else {
      setStreak(0);
      setFeedback("Almost! Rearrange the letters and try again.");
      setIsCorrect(false);
    }
  }

  function chooseLetter(tileId: number) {
    if (isCorrect || usedTileIds.has(tileId)) return;
    const nextIds = [...answerTileIds, tileId];
    setAnswerTileIds(nextIds);
    if (nextIds.length === currentWord.answer.length) submitAnswer(nextIds);
  }

  function removeLetter(tileId?: number) {
    if (isCorrect || answerTileIds.length === 0) return;
    const nextIds = tileId === undefined ? answerTileIds.slice(0, -1) : answerTileIds.filter((id) => id !== tileId);
    setAnswerTileIds(nextIds);
    setFeedback("");
  }

  function useHint() {
    if (isCorrect || hintsLeft <= 0) return;
    const nextPosition = answerTileIds.length;
    const neededLetter = currentWord.answer[nextPosition];
    const tile = letterTiles.find((item) => !usedTileIds.has(item.id) && item.letter === neededLetter);
    if (!tile) return;
    const nextIds = [...answerTileIds, tile.id];
    setAnswerTileIds(nextIds);
    setHintsLeft((count) => count - 1);
    setHintUsed(true);
    setFeedback("Hint used: one letter placed. This answer is worth 10 points.");
    if (nextIds.length === currentWord.answer.length) submitAnswer(nextIds, true);
  }

  function nextQuestion() {
    if (questionIndex + 1 >= round.length) {
      setElapsedSeconds(startedAt === null ? 0 : Math.floor((Date.now() - startedAt) / 1000));
      setPhase("results");
      return;
    }
    const nextIndex = questionIndex + 1;
    setQuestionIndex(nextIndex);
    setLetterTiles(scramble(round[nextIndex].answer));
    setAnswerTileIds([]);
    setHintUsed(false);
    setFeedback("");
    setIsCorrect(false);
  }

  if (!isLoaded) return <p className="py-16 text-center text-sm text-slate-500">Loading your vocabulary…</p>;

  return (
    <div className="word-scramble-page">
      <Link href="/games" className="mb-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"><ArrowLeft size={16} /> Back to Games</Link>

      <header className="word-scramble-hero">
        <span className="word-scramble-hero-sparkle" aria-hidden="true">✦</span>
        <p>Vocabulary game</p>
        <h1>Word <span>Scramble</span></h1>
        <p className="word-scramble-subtitle">Put the letters in the right order!</p>
      </header>

      {phase === "setup" ? (
        <div className="word-scramble-setup">
          <Card className="word-scramble-panel">
            <div className="word-scramble-section-title"><span><CaseSensitive size={25} /></span><div><h2>Ready to unscramble?</h2><p>Use the picture and meaning clues to spell each vocabulary word.</p></div></div>
            <label htmlFor="word-scramble-category">Category</label>
            <select id="word-scramble-category" value={category} onChange={(event) => setCategory(event.target.value)}>
              {categoryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <fieldset><legend>Questions per round</legend><div className="word-scramble-counts">{QUESTION_COUNTS.map((count) => <button key={count} type="button" aria-pressed={questionCount === count} disabled={candidates.length < count} onClick={() => setQuestionCount(count)} className={questionCount === count ? "is-selected" : ""}>{count} questions</button>)}</div><p>{candidates.length} words available. Words must have 3–10 letters.</p></fieldset>
            {candidates.length < 5 && <p className="word-scramble-empty" role="status">Add at least five eligible words to play Word Scramble.</p>}
            <button type="button" className="word-scramble-primary" disabled={candidates.length < questionCount} onClick={startRound}><CaseSensitive size={20} /> Start game <ArrowRight size={19} /></button>
          </Card>
          <Card className="word-scramble-howto"><span><Lightbulb size={22} /></span><h2>How to play</h2><p>Tap the letter tiles to spell the answer. Use a hint if you get stuck. Correct answers build your streak.</p><div className="word-scramble-example"><b>B</b><b>A</b><b>N</b><b>A</b><b>N</b><b>A</b></div><small><Star size={14} fill="currentColor" /> 20 points per answer, or 10 with a hint.</small></Card>
        </div>
      ) : phase === "playing" && currentWord ? (
        <Card className="word-scramble-game-card">
          <div className="word-scramble-topline">
            <div className="word-scramble-level"><div><strong>Level {questionIndex + 1} of {round.length}</strong><span>{questionIndex + 1} / {round.length}</span></div><i><b style={{ width: `${((questionIndex + 1) / round.length) * 100}%` }} /></i></div>
            <div className="word-scramble-stat"><Star size={30} fill="currentColor" /><span><small>Score</small><strong>{score}</strong></span></div>
            <div className="word-scramble-stat word-scramble-streak"><span className="word-scramble-flame">♨</span><span><small>Streak</small><strong>{streak}</strong></span></div>
            <div className="word-scramble-stat word-scramble-clock"><Clock3 size={20} /><span><small>Time</small><strong>{timeLabel}</strong></span></div>
          </div>

          <div className="word-scramble-prompt">
            <ScrambleImage key={currentWord.id} word={currentWord} />
            <div className="word-scramble-clues">
              <p className="word-scramble-meaning-clue">{currentWord.meaning}</p>
              <div className="word-scramble-meaning-row"><PronunciationButton word={currentWord.word} /><span>Listen to the word</span><small>{currentWord.category}</small></div>
              <div className="word-scramble-answer" aria-label={`Answer, ${currentWord.answer.length} letters`}>
                {[...currentWord.answer].map((_, index) => {
                  const tileId = answerTileIds[index];
                  const letter = tileId === undefined ? "" : letterTiles.find((tile) => tile.id === tileId)?.letter ?? "";
                  return <button key={index} type="button" aria-label={letter ? `Remove letter ${letter}` : `Empty letter position ${index + 1}`} disabled={!letter || isCorrect} onClick={() => tileId !== undefined && removeLetter(tileId)} className={`word-scramble-slot ${letter ? "has-letter" : ""} ${isCorrect ? "is-correct" : feedback && !isCorrect ? "is-incorrect" : ""}`}>{letter}</button>;
                })}
              </div>
              <p className={`word-scramble-feedback ${isCorrect ? "is-correct" : feedback ? "is-incorrect" : ""}`} aria-live="polite">{feedback || "Choose the letters in the correct order."}</p>
            </div>
          </div>

          {!isCorrect ? <>
            <div className="word-scramble-letter-bank" aria-label="Available letters">
              {letterTiles.map((tile) => <button key={tile.id} type="button" disabled={usedTileIds.has(tile.id)} onClick={() => chooseLetter(tile.id)} aria-label={`Choose ${tile.letter}`} className={usedTileIds.has(tile.id) ? "is-used" : ""}>{tile.letter}</button>)}
              <button type="button" className="word-scramble-backspace" aria-label="Remove last letter" disabled={!answerTileIds.length} onClick={() => removeLetter()}><Delete size={24} /></button>
            </div>
            <div className="word-scramble-actions"><button type="button" className="word-scramble-hint" disabled={!hintsLeft} onClick={useHint}><Lightbulb size={21} /> Hint <span>{hintsLeft}</span></button><span className="word-scramble-hint-note">Hints place one letter and reduce points.</span></div>
          </> : <div className="word-scramble-correct-actions"><span><Check size={18} /> +{hintUsed ? 10 : 20} points</span><button type="button" className="word-scramble-next" onClick={nextQuestion}>{questionIndex + 1 === round.length ? "See results" : "Next question"} <ArrowRight size={21} /></button></div>}
        </Card>
      ) : (
        <Card className="word-scramble-results">
          <span className="word-scramble-trophy"><Trophy size={38} /></span><p>ROUND COMPLETE</p><h2>Awesome word star!</h2><span className="word-scramble-final-score">{score}<small> points</small></span>
          <div><span><strong>{round.length}</strong><small>questions</small></span><span><strong>{bestStreak}</strong><small>best streak</small></span><span><strong>{timeLabel}</strong><small>time</small></span></div>
          {isAuthenticated && <p className={`word-match-save-state ${saveState}`} role="status">{saveState === "saving" ? "Saving your leaderboard result…" : saveState === "saved" ? "Result saved to the leaderboard." : saveState === "error" ? saveError : ""}{saveState === "error" && <button type="button" onClick={() => setSaveRetryCount((count) => count + 1)}>Try again</button>}</p>}
          <button type="button" className="word-scramble-primary" onClick={startRound}><RotateCcw size={18} /> Play again</button>
        </Card>
      )}
    </div>
  );
}

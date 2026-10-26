"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Clock3, RotateCcw, Shuffle, Sparkles, Trophy } from "lucide-react";

import { useVocabulary } from "@/contexts/VocabularyContext";
import type { VocabularyWord } from "@/data/vocabulary";
import { Card } from "@/components/ui/Card";
import { useVocabularyImageUrl } from "@/hooks/useVocabularyImageUrl";
import { saveVocabularyGameSession } from "@/lib/supabase/game-leaderboard";

type Phase = "setup" | "playing" | "results";
type PairCount = 6 | 8 | 10;
type MatchPair = { id: string; word: string; meaning: string; imagePath: string | null; imageUrl: string | null };
type MatchCardData = { id: string; pairId: string; kind: "word" | "match" };

const PAIR_COUNTS: PairCount[] = [6, 8, 10];

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function formatTime(totalSeconds: number): string {
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

function getWordMeaning(word: VocabularyWord): string {
  return word.detailedMeanings?.find((item) => item.meaning.trim())?.meaning.trim() || word.meaning.trim();
}

function MatchCard({
  card,
  pair,
  isRevealed,
  isMatched,
  isWrong,
  locked,
  onClick,
}: {
  card: MatchCardData;
  pair: MatchPair;
  isRevealed: boolean;
  isMatched: boolean;
  isWrong: boolean;
  locked: boolean;
  onClick: () => void;
}) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const signedImageUrl = useVocabularyImageUrl(pair.imagePath);
  const imageUrl = pair.imageUrl ?? signedImageUrl;
  const isImage = card.kind === "match" && Boolean(imageUrl) && imageUrl !== failedImageUrl;
  const label = card.kind === "word" ? pair.word : isImage ? `Picture matching ${pair.word}` : pair.meaning;

  return (
    <button
      type="button"
      aria-label={isRevealed || isMatched ? label : "Reveal a matching card"}
      aria-pressed={isRevealed || isMatched}
      disabled={isMatched || locked}
      onClick={onClick}
      className={`word-match-flip-card ${isRevealed || isMatched ? "is-revealed" : ""} ${isMatched ? "is-matched" : ""} ${isWrong ? "is-wrong" : ""}`}
    >
      <span className="word-match-flip-inner">
        <span className="word-match-card-back" aria-hidden={isRevealed || isMatched}>
          <span className="word-match-card-question">?</span>
          <Sparkles size={18} className="word-match-card-sparkle" aria-hidden="true" />
        </span>
        <span className="word-match-card-front" aria-hidden={!isRevealed && !isMatched}>
          {isImage ? <Image src={imageUrl!} alt="" width={112} height={112} unoptimized onError={() => setFailedImageUrl(imageUrl!)} className="word-match-card-image" /> : <span className={card.kind === "word" ? "word-match-card-word" : "word-match-card-meaning"}>{card.kind === "word" ? pair.word : pair.meaning}</span>}
          {isMatched && <span className="word-match-card-check"><Check size={17} aria-hidden="true" /></span>}
        </span>
      </span>
    </button>
  );
}

export function WordMatchContent() {
  const { words, categories, isLoaded, isAuthenticated } = useVocabulary();
  const [category, setCategory] = useState("all");
  const [pairCount, setPairCount] = useState<PairCount>(6);
  const [phase, setPhase] = useState<Phase>("setup");
  const [pairs, setPairs] = useState<MatchPair[]>([]);
  const [cards, setCards] = useState<MatchCardData[]>([]);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(() => new Set());
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [wrongCardIds, setWrongCardIds] = useState<string[]>([]);
  const [isResolving, setIsResolving] = useState(false);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState("");
  const [saveRetryCount, setSaveRetryCount] = useState(0);
  const mismatchTimerRef = useRef<number | null>(null);
  const resolvingRef = useRef(false);
  const saveStartedRef = useRef<number | null>(null);

  const availablePairs = useMemo(() => {
    const eligibleWords = category === "all" ? words : words.filter((word) => word.category === category);
    const usedWords = new Set<string>();
    const usedMatches = new Set<string>();
    return eligibleWords.flatMap((word) => {
      const text = word.word.trim();
      const meaning = getWordMeaning(word);
      const matchKey = word.imagePath || word.imageUrl ? `image:${word.id}` : `meaning:${meaning.toLocaleLowerCase()}`;
      if (!text || !meaning || usedWords.has(text.toLocaleLowerCase()) || usedMatches.has(matchKey)) return [];
      usedWords.add(text.toLocaleLowerCase());
      usedMatches.add(matchKey);
      return [{ id: word.id, word: text, meaning, imagePath: word.imagePath ?? null, imageUrl: word.imageUrl ?? null }];
    });
  }, [category, words]);

  const categoryOptions = useMemo(() => {
    const names = [...new Set([...categories.map((item) => item.name), ...words.map((word) => word.category)])]
      .filter((name) => name.trim() && name.trim().toLocaleLowerCase() !== "uncategorized")
      .sort((left, right) => left.localeCompare(right));
    return [{ value: "all", label: "All categories" }, ...names.map((name) => ({ value: name, label: name }))];
  }, [categories, words]);

  useEffect(() => {
    if (phase !== "playing" || startedAt === null) return;
    const updateTime = () => setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    updateTime();
    const interval = window.setInterval(updateTime, 1000);
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
      gameType: "word-match",
      roundSize: pairs.length,
      score,
      correctCount: pairs.length,
      moves,
      durationSeconds,
      startedAt: new Date(startedAt).toISOString(),
      completedAt: new Date(completedAt).toISOString(),
    }).then(() => setSaveState("saved")).catch((error: unknown) => {
      saveStartedRef.current = null;
      setSaveState("error");
      setSaveError(error instanceof Error ? error.message : "Could not save this result.");
    });
  }, [isAuthenticated, moves, pairs.length, phase, saveRetryCount, score, startedAt]);

  useEffect(() => () => {
    if (mismatchTimerRef.current !== null) window.clearTimeout(mismatchTimerRef.current);
  }, []);

  function startRound() {
    if (availablePairs.length < pairCount) return;
    if (mismatchTimerRef.current !== null) window.clearTimeout(mismatchTimerRef.current);
    const nextPairs = shuffle(availablePairs).slice(0, pairCount);
    const nextCards = nextPairs.flatMap((pair) => [
      { id: `${pair.id}:word`, pairId: pair.id, kind: "word" as const },
      { id: `${pair.id}:match`, pairId: pair.id, kind: "match" as const },
    ]);
    const now = Date.now();
    setPairs(nextPairs);
    setCards(shuffle(nextCards));
    setMatchedIds(new Set());
    setSelectedCardIds([]);
    setWrongCardIds([]);
    setMoves(0);
    setScore(0);
    setFeedback("Flip two cards to find a matching word and picture or meaning.");
    setElapsedSeconds(0);
    setStartedAt(now);
    saveStartedRef.current = null;
    setSaveState("idle");
    setSaveError("");
    resolvingRef.current = false;
    setIsResolving(false);
    setPhase("playing");
  }

  function selectCard(card: MatchCardData, selectedAt: number) {
    if (phase !== "playing" || matchedIds.has(card.pairId) || selectedCardIds.includes(card.id) || resolvingRef.current) return;

    if (selectedCardIds.length === 0) {
      setSelectedCardIds([card.id]);
      setFeedback("Now flip one more card.");
      return;
    }

    const firstCard = cards.find((item) => item.id === selectedCardIds[0]);
    if (!firstCard) return;
    setMoves((count) => count + 1);
    setSelectedCardIds([firstCard.id, card.id]);

    if (firstCard.pairId === card.pairId && firstCard.kind !== card.kind) {
      const nextMatchedIds = new Set(matchedIds).add(card.pairId);
      setMatchedIds(nextMatchedIds);
      setSelectedCardIds([]);
      setScore((value) => value + 10);
      setFeedback("Great match! +10 points");
      if (nextMatchedIds.size === pairs.length) {
        setElapsedSeconds(startedAt === null ? elapsedSeconds : Math.floor((selectedAt - startedAt) / 1000));
        setPhase("results");
      }
      return;
    }

    resolvingRef.current = true;
    setIsResolving(true);
    setWrongCardIds([firstCard.id, card.id]);
    setFeedback("Those cards do not match. Try again!");
    mismatchTimerRef.current = window.setTimeout(() => {
      setWrongCardIds([]);
      setSelectedCardIds([]);
      setFeedback("Flip two cards to find a matching word and picture or meaning.");
      resolvingRef.current = false;
      setIsResolving(false);
      mismatchTimerRef.current = null;
    }, 850);
  }

  if (!isLoaded) return <p className="py-16 text-center text-sm text-slate-500">Loading your vocabulary…</p>;

  const pairById = new Map(pairs.map((pair) => [pair.id, pair]));
  const matchedLabel = `${matchedIds.size} / ${pairs.length} pairs matched`;
  const progressPercent = pairs.length ? (matchedIds.size / pairs.length) * 100 : 0;

  return (
    <div className={`word-match-page ${phase === "playing" ? "word-match-playing" : ""}`}>
      <Link href="/games" className="mb-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"><ArrowLeft size={16} /> Back to Games</Link>

      <header className="word-match-hero">
        <div className="word-match-hero-copy">
          <p className="text-sm font-semibold text-blue-600">Vocabulary game</p>
          <h1 className="page-title word-match-title mt-1"><span>Word Match</span><Shuffle size={25} className="shrink-0 text-violet-500" aria-hidden="true" /></h1>
          <p className="page-intro-description mt-2">Flip cards to match a word with its picture or meaning.</p>
        </div>
        <div className="word-match-hero-art" aria-hidden="true"><span>word</span><Shuffle size={27} /><span>picture</span></div>
      </header>

      {phase === "setup" ? (
        <div className="word-match-setup-grid">
          <Card className="word-match-setup-card">
            <div className="word-match-section-heading"><span><Shuffle size={23} /></span><div><h2>Set up your round</h2><p>Choose a category and how many pairs to find.</p></div></div>

            <label className="word-match-label" htmlFor="word-match-category">Category</label>
            <select id="word-match-category" value={category} onChange={(event) => setCategory(event.target.value)} className="word-match-select">
              {categoryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>

            <fieldset className="word-match-count-fieldset">
              <legend>Number of pairs</legend>
              <div className="word-match-count-options">
                {PAIR_COUNTS.map((count) => <button key={count} type="button" aria-pressed={pairCount === count} disabled={availablePairs.length < count} onClick={() => setPairCount(count)} className={`word-match-count ${pairCount === count ? "is-selected" : ""}`}>{count} pairs</button>)}
              </div>
              <p>{availablePairs.length} pairs available. Words with pictures match to pictures; other words match to meanings.</p>
            </fieldset>

            {availablePairs.length < 2 && <p className="word-match-empty-note" role="status">Add at least two words with meanings to play this round.</p>}
            <button type="button" onClick={startRound} disabled={availablePairs.length < pairCount} className="word-match-start"><Shuffle size={19} /> Start matching <ArrowRight size={19} /></button>
          </Card>

          <Card className="word-match-preview-card">
            <p className="word-match-eyebrow">HOW TO PLAY</p>
            <h2>Flip to find a match</h2>
            <p>Reveal two cards at a time. Match a word with its picture or meaning to score points.</p>
            <div className="word-match-preview-pair"><span>apple</span><ArrowRight size={18} /><span>🍎</span></div>
            <div className="word-match-preview-pair"><span>sun</span><ArrowRight size={18} /><span>mặt trời</span></div>
            <p className="word-match-preview-footnote"><Sparkles size={16} /> Each correct pair earns 10 points.</p>
          </Card>
        </div>
      ) : phase === "playing" ? (
        <Card className="word-match-board-card">
          <div className="word-match-board-header">
            <div className="word-match-board-heading"><div><p className="word-match-eyebrow">WORD MATCH ADVENTURE</p><h2>{matchedLabel}</h2></div><button type="button" onClick={startRound} className="word-match-restart"><RotateCcw size={16} /> Restart</button></div>
            <div className="word-match-stats">
              <span className="word-match-score-stat"><Trophy size={18} /> <small>Score</small> {score}</span>
              <span><Shuffle size={17} /> <small>Moves</small> {moves}</span>
              <span className="word-match-level-stat"><small>Level 1</small><strong>{matchedIds.size} / {pairs.length} pairs</strong><i><b style={{ width: `${progressPercent}%` }} /></i></span>
              <span><Clock3 size={17} /> {formatTime(elapsedSeconds)}</span>
            </div>
          </div>
          <p className={`word-match-instruction ${feedback.startsWith("Great match") ? "is-success" : feedback.startsWith("Those cards") ? "is-error" : ""}`} aria-live="polite">{feedback}</p>
          <div className={`word-match-card-grid is-round-${pairCount}`}>
            {cards.map((card) => {
              const pair = pairById.get(card.pairId);
              if (!pair) return null;
              return <MatchCard key={card.id} card={card} pair={pair} isRevealed={selectedCardIds.includes(card.id)} isMatched={matchedIds.has(card.pairId)} isWrong={wrongCardIds.includes(card.id)} locked={isResolving} onClick={() => selectCard(card, Date.now())} />;
            })}
          </div>
          <button type="button" onClick={() => setPhase("setup")} className="word-match-exit"><ArrowLeft size={16} /> Exit round</button>
        </Card>
      ) : (
        <Card className="word-match-results-card">
          <span className="word-match-results-icon"><Trophy size={35} /></span>
          <p className="word-match-eyebrow">ROUND COMPLETE</p>
          <h2>Great matching!</h2>
          <p className="word-match-results-copy">You matched all {pairs.length} pairs and scored {score} points.</p>
          <div className="word-match-result-stats"><span><strong>{score}</strong><small>score</small></span><span><strong>{moves}</strong><small>moves</small></span><span><strong>{formatTime(elapsedSeconds)}</strong><small>time</small></span></div>
          {isAuthenticated && <p className={`word-match-save-state ${saveState}`} role="status">{saveState === "saving" ? "Saving your leaderboard result…" : saveState === "saved" ? "Result saved to the leaderboard." : saveState === "error" ? saveError : ""}{saveState === "error" && <button type="button" onClick={() => setSaveRetryCount((count) => count + 1)}>Try again</button>}</p>}
          <div className="word-match-result-actions"><button type="button" onClick={startRound} className="word-match-start"><RotateCcw size={18} /> Play again</button><button type="button" onClick={() => setPhase("setup")} className="word-match-secondary">Change settings</button></div>
        </Card>
      )}
    </div>
  );
}

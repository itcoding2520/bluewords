"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Clock3, RotateCcw, Shuffle, Sparkles, Trophy } from "lucide-react";

import { useVocabulary } from "@/contexts/VocabularyContext";
import { Card } from "@/components/ui/Card";
import { CategoryDropdown } from "@/components/vocabulary/VocabularyCategoryDropdown";
import { useVocabularyImageUrl } from "@/hooks/useVocabularyImageUrl";
import { useWordMatchController, type MatchCardData, type MatchPair } from "@/hooks/useWordMatchController";
import { formatGameDuration } from "@/lib/game-duration";

type PairCount = 6 | 8 | 10;

const PAIR_COUNTS: PairCount[] = [6, 8, 10];


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
  const {
    category, setCategory, pairCount, setPairCount, phase, setPhase,
    pairs, cards, matchedIds, selectedCardIds, wrongCardIds, isResolving,
    moves, score, feedback, availablePairs, categoryDropdownCategories,
    elapsedSeconds, saveState, saveError, retrySave, pairById, matchedLabel,
    progressPercent, startRound, selectCard,
  } = useWordMatchController({ words, categories, isAuthenticated });

  if (!isLoaded) return <p className="py-16 text-center text-sm text-slate-500">Loading your vocabulary…</p>;

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
            <CategoryDropdown id="word-match-category" ariaLabel="Word Match category" category={category} categories={categoryDropdownCategories} words={words} onChange={setCategory} includeAll fullWidth />

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
              <span><Clock3 size={17} /> {formatGameDuration(elapsedSeconds)}</span>
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
          <div className="word-match-result-stats"><span><strong>{score}</strong><small>score</small></span><span><strong>{moves}</strong><small>moves</small></span><span><strong>{formatGameDuration(elapsedSeconds)}</strong><small>time</small></span></div>
          {isAuthenticated && <p className={`word-match-save-state ${saveState}`} role="status">{saveState === "saving" ? "Saving your leaderboard result…" : saveState === "saved" ? "Result saved to the leaderboard." : saveState === "error" ? saveError : ""}{saveState === "error" && <button type="button" onClick={retrySave}>Try again</button>}</p>}
          <div className="word-match-result-actions"><button type="button" onClick={startRound} className="word-match-start"><RotateCcw size={18} /> Play again</button><button type="button" onClick={() => setPhase("setup")} className="word-match-secondary">Change settings</button></div>
        </Card>
      )}
    </div>
  );
}

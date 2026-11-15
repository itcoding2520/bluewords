"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, CaseSensitive, Check, Clock3, Delete, Lightbulb, RotateCcw, Sparkles, Star, Trophy } from "lucide-react";

import { useVocabulary } from "@/contexts/VocabularyContext";
import { useVocabularyImageUrl } from "@/hooks/useVocabularyImageUrl";
import { Card } from "@/components/ui/Card";
import { CategoryDropdown } from "@/components/vocabulary/VocabularyCategoryDropdown";
import { PronunciationButton } from "@/components/vocabulary/PronunciationButton";
import { useWordScrambleController, type ScrambleWord } from "@/hooks/useWordScrambleController";

const QUESTION_COUNTS = [5, 10] as const;

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
  const {
    category, setCategory, questionCount, setQuestionCount, phase, round,
    questionIndex, letterTiles, answerTileIds, score, streak, bestStreak,
    hintsLeft, hintUsed, feedback, isCorrect, candidates, categoryDropdownCategories,
    currentWord, usedTileIds, timeLabel, saveState, saveError, retrySave,
    startRound, chooseLetter, removeLetter, useHint, nextQuestion,
  } = useWordScrambleController({ words, categories, isAuthenticated });

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
            <CategoryDropdown id="word-scramble-category" ariaLabel="Word Scramble category" category={category} categories={categoryDropdownCategories} words={words} onChange={setCategory} includeAll fullWidth />
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
          {isAuthenticated && <p className={`word-match-save-state ${saveState}`} role="status">{saveState === "saving" ? "Saving your leaderboard result…" : saveState === "saved" ? "Result saved to the leaderboard." : saveState === "error" ? saveError : ""}{saveState === "error" && <button type="button" onClick={retrySave}>Try again</button>}</p>}
          <button type="button" className="word-scramble-primary" onClick={startRound}><RotateCcw size={18} /> Play again</button>
        </Card>
      )}
    </div>
  );
}

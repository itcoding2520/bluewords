"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, CaseSensitive, Lightbulb, RotateCcw, Star, Trophy } from "lucide-react";

import { useVocabulary } from "@/contexts/VocabularyContext";
import { Card } from "@/components/ui/Card";
import { CategoryDropdown } from "@/components/vocabulary/VocabularyCategoryDropdown";
import { WordScrambleRound } from "@/components/games/WordScrambleRound";
import { useWordScrambleController } from "@/hooks/useWordScrambleController";

const QUESTION_COUNTS = [5, 10] as const;

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
        <WordScrambleRound
          currentWord={currentWord}
          questionIndex={questionIndex}
          questionCount={round.length}
          letterTiles={letterTiles}
          answerTileIds={answerTileIds}
          usedTileIds={usedTileIds}
          score={score}
          streak={streak}
          timeLabel={timeLabel}
          hintsLeft={hintsLeft}
          hintUsed={hintUsed}
          feedback={feedback}
          isCorrect={isCorrect}
          onChooseLetter={chooseLetter}
          onRemoveLetter={removeLetter}
          onUseHint={useHint}
          onNextQuestion={nextQuestion}
        />
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

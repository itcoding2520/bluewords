"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { useVocabulary } from "@/contexts/VocabularyContext";
import { WordScrambleRound } from "@/components/games/WordScrambleRound";
import { useWordScrambleController } from "@/hooks/useWordScrambleController";
import { WordScrambleSetup } from "@/components/games/WordScrambleSetup";
import { WordScrambleResults } from "@/components/games/WordScrambleResults";

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
        <WordScrambleSetup
          words={words}
          categories={categoryDropdownCategories}
          category={category}
          onCategoryChange={setCategory}
          questionCount={questionCount}
          onQuestionCountChange={setQuestionCount}
          candidateCount={candidates.length}
          onStart={startRound}
        />
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
        <WordScrambleResults
          score={score}
          questionCount={round.length}
          bestStreak={bestStreak}
          timeLabel={timeLabel}
          isAuthenticated={isAuthenticated}
          saveState={saveState}
          saveError={saveError}
          onRetry={retrySave}
          onPlayAgain={startRound}
        />
      )}
    </div>
  );
}

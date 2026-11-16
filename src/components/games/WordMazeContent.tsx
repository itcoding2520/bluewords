"use client";

import Link from "next/link";
import { ArrowLeft, Map } from "lucide-react";
import { useVocabulary } from "@/contexts/VocabularyContext";
import { useWordMazeController } from "@/hooks/useWordMazeController";
import { WordMazeResults } from "@/components/games/WordMazeResults";
import { WordMazeRound } from "@/components/games/WordMazeRound";
import { WordMazeSetup } from "@/components/games/WordMazeSetup";

export function WordMazeContent() {
  const { words, categories, isLoaded, isAuthenticated } = useVocabulary();
  const {
    setup: {
      category, setCategory, candidates, categoryDropdownCategories, startGame,
    },
    game: {
      phase, round, questionIndex, score, lives, feedback, selectedChoice,
      won, current, progress, chooseAnswer, continuePath,
    },
    session: { elapsedSeconds, saveState, saveError, retrySave },
  } = useWordMazeController({ words, categories, isAuthenticated });

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
        <WordMazeSetup
          category={category}
          categories={categoryDropdownCategories}
          words={words}
          candidateCount={candidates.length}
          onCategoryChange={setCategory}
          onStart={startGame}
        />
      ) : phase === "playing" && current ? (
        <WordMazeRound
          current={current}
          questionIndex={questionIndex}
          roundLength={round.length}
          score={score}
          lives={lives}
          feedback={feedback}
          selectedChoice={selectedChoice}
          progress={progress}
          onChoose={chooseAnswer}
          onContinue={continuePath}
        />
      ) : (
        <WordMazeResults
          won={won}
          score={score}
          progress={progress}
          roundLength={round.length}
          lives={lives}
          elapsedSeconds={elapsedSeconds}
          isAuthenticated={isAuthenticated}
          saveState={saveState}
          saveError={saveError}
          onRetry={retrySave}
          onPlayAgain={startGame}
        />
      )}
    </div>
  );
}

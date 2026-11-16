"use client";

import Link from "next/link";
import { ArrowLeft, Shuffle } from "lucide-react";

import { useVocabulary } from "@/contexts/VocabularyContext";
import { WordMatchBoard } from "@/components/games/WordMatchBoard";
import { WordMatchResults } from "@/components/games/WordMatchResults";
import { WordMatchSetup } from "@/components/games/WordMatchSetup";
import { useWordMatchController } from "@/hooks/useWordMatchController";

export function WordMatchContent() {
  const { words, categories, isLoaded, isAuthenticated } = useVocabulary();
  const {
    setup: {
      category, setCategory, pairCount, setPairCount, availablePairs,
      categoryDropdownCategories, startRound,
    },
    game: {
      phase, setPhase, pairs, cards, matchedIds, selectedCardIds, wrongCardIds,
      isResolving, moves, score, feedback, pairById, matchedLabel,
      progressPercent, selectCard,
    },
    session: { elapsedSeconds, saveState, saveError, retrySave },
  } = useWordMatchController({ words, categories, isAuthenticated });

  if (!isLoaded) return <p className="py-16 text-center text-sm text-slate-500">Loading your vocabulary…</p>;

  return (
    <div className={`word-match-page ${phase === "playing" ? "word-match-playing" : ""}`}>
      <Link href="/games" className="mb-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
        <ArrowLeft size={16} /> Back to Games
      </Link>

      <header className="word-match-hero">
        <div className="word-match-hero-copy">
          <p className="text-sm font-semibold text-blue-600">Vocabulary game</p>
          <h1 className="page-title word-match-title mt-1">
            <span>Word Match</span>
            <Shuffle size={25} className="shrink-0 text-violet-500" aria-hidden="true" />
          </h1>
          <p className="page-intro-description mt-2">Flip cards to match a word with its picture or meaning.</p>
        </div>
        <div className="word-match-hero-art" aria-hidden="true"><span>word</span><Shuffle size={27} /><span>picture</span></div>
      </header>

      {phase === "setup" ? (
        <WordMatchSetup
          words={words}
          categories={categoryDropdownCategories}
          category={category}
          onCategoryChange={setCategory}
          pairCount={pairCount}
          onPairCountChange={setPairCount}
          availablePairCount={availablePairs.length}
          onStart={startRound}
        />
      ) : phase === "playing" ? (
        <WordMatchBoard
          pairCount={pairCount}
          pairs={pairs}
          cards={cards}
          matchedIds={matchedIds}
          selectedCardIds={selectedCardIds}
          wrongCardIds={wrongCardIds}
          isResolving={isResolving}
          moves={moves}
          score={score}
          feedback={feedback}
          elapsedSeconds={elapsedSeconds}
          pairById={pairById}
          matchedLabel={matchedLabel}
          progressPercent={progressPercent}
          onSelectCard={selectCard}
          onRestart={startRound}
          onExit={() => setPhase("setup")}
        />
      ) : (
        <WordMatchResults
          pairCount={pairs.length}
          score={score}
          moves={moves}
          elapsedSeconds={elapsedSeconds}
          isAuthenticated={isAuthenticated}
          saveState={saveState}
          saveError={saveError}
          onRetry={retrySave}
          onPlayAgain={startRound}
          onChangeSettings={() => setPhase("setup")}
        />
      )}
    </div>
  );
}

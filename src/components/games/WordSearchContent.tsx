"use client";

import Link from "next/link";
import { ArrowLeft, Gamepad2, History, Star } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { WordSearchResults } from "@/components/games/WordSearchResults";
import { WordSearchSetupForm } from "@/components/games/WordSearchSetupForm";
import { WordSearchHistoryView } from "@/components/games/WordSearchHistoryView";
import { WordSearchBoardPreview } from "@/components/games/WordSearchBoardPreview";
import { WordSearchPlayingBoard } from "@/components/games/WordSearchPlayingBoard";
import { WordSearchGameHeader } from "@/components/games/WordSearchGameHeader";
import { useWordSearchController } from "@/hooks/useWordSearchController";
import { formatGameDuration } from "@/lib/game-duration";

export function WordSearchContent({ userId }: { userId: string | null }) {
  const {
    isLoaded,
    gridSize,
    setGridSize,
    difficulty,
    setDifficulty,
    category,
    setCategory,
    categoriesExpanded,
    setCategoriesExpanded,
    phase,
    setPhase,
    tab,
    setTab,
    puzzle,
    foundIds,
    foundWordPaths,
    selectedHistory,
    setSelectedHistory,
    elapsedSeconds,
    saveState,
    saveError,
    retrySave,
    history,
    historyPage,
    setHistoryPage,
    historyTotal,
    historyLoading,
    historyError,
    loadHistory,
    fastestHistorySeconds,
    averageWordsPerRound,
    vocabularyById,
    vocabularyByWord,
    categoryOptions,
    targetCount,
    showStickyStart,
    gameError,
    selectedCells,
    clearSelection,
    handleGridPointerDown,
    handleGridPointerMove,
    handleGridPointerUp,
    handleGridPointerCancel,
    handleStartGame,
    backToSetup,
  } = useWordSearchController(userId);

  if (!isLoaded) return <p className="py-16 text-sm text-slate-500">Loading vocabulary…</p>;

  if (phase === "setup") {
    return (
      <div className={`word-search-setup-page ${showStickyStart ? "pb-24 sm:pb-0" : ""}`}>
        <Link href="/games" className="word-search-back-link mb-5 inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"><ArrowLeft size={16} /> Back to Games</Link>
        <header className="word-search-setup-hero mb-6">
          <p className="text-sm font-bold text-blue-600">Vocabulary game</p>
          <h1 className="page-title mt-1 flex items-center gap-2">Word Search <Star className="size-6 fill-amber-400 text-amber-400" /></h1>
          <p className="page-intro-description mt-2">Find every vocabulary word in the letter grid as quickly as you can.</p>
        </header>

        <div className="word-search-setup-tabs mb-5 flex gap-2 border-b border-slate-200">
          <button type="button" onClick={() => { setTab("play"); setSelectedHistory(null); }} className={`inline-flex min-h-11 items-center gap-2 border-b-2 px-3 text-sm font-medium ${tab === "play" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}><Gamepad2 size={16} /> Play</button>
          {userId && <button type="button" onClick={() => { setTab("history"); setSelectedHistory(null); void loadHistory(); }} className={`inline-flex min-h-11 items-center gap-2 border-b-2 border-transparent px-3 text-sm font-medium text-slate-500 hover:text-slate-800 ${tab === "history" ? "!border-blue-600 !text-blue-700" : ""}`}><History size={16} /> History</button>}
        </div>

        {tab === "history" ? (
          <WordSearchHistoryView
            selectedHistory={selectedHistory}
            history={history}
            historyTotal={historyTotal}
            historyPage={historyPage}
            historyLoading={historyLoading}
            historyError={historyError}
            fastestSeconds={fastestHistorySeconds}
            averageWordsPerRound={averageWordsPerRound}
            vocabularyByWord={vocabularyByWord}
            onBack={() => setSelectedHistory(null)}
            onPlay={() => { setSelectedHistory(null); setTab("play"); }}
            onSelect={setSelectedHistory}
            onRefresh={() => void loadHistory(true)}
            onPageChange={(page) => { setHistoryPage(page); void loadHistory(false, page); }}
          />
        ) : (
        <WordSearchSetupForm
          gridSize={gridSize}
          difficulty={difficulty}
          category={category}
          categoriesExpanded={categoriesExpanded}
          categoryOptions={categoryOptions}
          targetCount={targetCount}
          gameError={gameError}
          onGridSizeChange={setGridSize}
          onDifficultyChange={setDifficulty}
          onCategoryChange={setCategory}
          onCategoriesExpandedChange={() => setCategoriesExpanded((expanded) => !expanded)}
          onStart={handleStartGame}
          preview={<WordSearchBoardPreview gridSize={gridSize} difficulty={difficulty} wordCount={targetCount} />}
        />
        )}
        {showStickyStart && (
          <div className="word-search-sticky-start fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur sm:hidden">
            <Button onClick={handleStartGame} disabled={targetCount === 0} className="min-h-12 w-full"><Gamepad2 size={17} /> Start game</Button>
          </div>
        )}
      </div>
    );
  }

  if (!puzzle) return null;

  return (
    <div className={phase === "playing" ? "word-search-playing" : "pb-8"}>
      <WordSearchGameHeader isPlaying={phase === "playing"} difficulty={difficulty} elapsedSeconds={elapsedSeconds} onBackToSetup={backToSetup} />

      {phase === "results" ? (
        <WordSearchResults
          wordCount={puzzle.words.length}
          duration={formatGameDuration(elapsedSeconds)}
          saveState={saveState}
          saveError={saveError}
          onRetrySave={() => {
            retrySave();
          }}
          onPlayAgain={handleStartGame}
          onViewHistory={() => {
            setPhase("setup");
            setTab("history");
            setHistoryPage(1);
            setSelectedHistory(null);
            void loadHistory(true, 1);
          }}
        />
      ) : (
        <WordSearchPlayingBoard
          letters={puzzle.letters}
          words={puzzle.words}
          gridSize={gridSize}
          foundIds={foundIds}
          foundWordPaths={foundWordPaths}
          selectedCells={selectedCells}
          vocabularyById={vocabularyById}
          onClearSelection={clearSelection}
          onPointerDown={handleGridPointerDown}
          onPointerMove={handleGridPointerMove}
          onPointerUp={handleGridPointerUp}
          onPointerCancel={handleGridPointerCancel}
        />
      )}
    </div>
  );
}

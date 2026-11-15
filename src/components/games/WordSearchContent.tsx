"use client";

import { WordSearchResults } from "@/components/games/WordSearchResults";
import { WordSearchSetupForm } from "@/components/games/WordSearchSetupForm";
import { WordSearchHistoryView } from "@/components/games/WordSearchHistoryView";
import { WordSearchSetupShell } from "@/components/games/WordSearchSetupShell";
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
    tab,
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
    openPlayTab,
    openHistoryTab,
    viewHistory,
    changeHistoryPage,
  } = useWordSearchController(userId);

  if (!isLoaded) return <p className="py-16 text-sm text-slate-500">Loading vocabulary…</p>;

  if (phase === "setup") {
    return (
      <WordSearchSetupShell
        userId={userId}
        tab={tab}
        showStickyStart={showStickyStart}
        targetCount={targetCount}
        onStart={handleStartGame}
        onOpenPlay={openPlayTab}
        onOpenHistory={openHistoryTab}
      >
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
            onPlay={openPlayTab}
            onSelect={setSelectedHistory}
            onRefresh={() => void loadHistory(true)}
            onPageChange={changeHistoryPage}
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
      </WordSearchSetupShell>
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
          onViewHistory={viewHistory}
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

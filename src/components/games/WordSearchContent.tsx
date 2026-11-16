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
  const { isLoaded, setup, history, game } = useWordSearchController(userId);

  if (!isLoaded) return <p className="py-16 text-sm text-slate-500">Loading vocabulary…</p>;

  if (game.phase === "setup") {
    return (
      <WordSearchSetupShell
        userId={userId}
        tab={setup.tab}
        showStickyStart={setup.showStickyStart}
        targetCount={setup.targetCount}
        onStart={setup.startGame}
        onOpenPlay={setup.openPlayTab}
        onOpenHistory={setup.openHistoryTab}
      >
        {setup.tab === "history" ? (
          <WordSearchHistoryView
            selectedHistory={history.selected}
            history={history.sessions}
            historyTotal={history.total}
            historyPage={history.page}
            historyLoading={history.loading}
            historyError={history.error}
            fastestSeconds={history.fastestSeconds}
            averageWordsPerRound={history.averageWordsPerRound}
            vocabularyByWord={history.vocabularyByWord}
            onBack={() => history.select(null)}
            onPlay={setup.openPlayTab}
            onSelect={history.select}
            onRefresh={() => void history.load(true)}
            onPageChange={history.changePage}
          />
        ) : (
        <WordSearchSetupForm
          gridSize={setup.gridSize}
          difficulty={setup.difficulty}
          category={setup.category}
          categoriesExpanded={setup.categoriesExpanded}
          categoryOptions={setup.categoryOptions}
          targetCount={setup.targetCount}
          gameError={setup.gameError}
          onGridSizeChange={setup.setGridSize}
          onDifficultyChange={setup.setDifficulty}
          onCategoryChange={setup.setCategory}
          onCategoriesExpandedChange={setup.toggleCategoriesExpanded}
          onStart={setup.startGame}
          preview={<WordSearchBoardPreview gridSize={setup.gridSize} difficulty={setup.difficulty} wordCount={setup.targetCount} />}
        />
        )}
      </WordSearchSetupShell>
    );
  }

  if (!game.puzzle) return null;

  return (
    <div className={game.phase === "playing" ? "word-search-playing" : "pb-8"}>
      <WordSearchGameHeader isPlaying={game.phase === "playing"} difficulty={setup.difficulty} elapsedSeconds={game.elapsedSeconds} onBackToSetup={game.backToSetup} />

      {game.phase === "results" ? (
        <WordSearchResults
          wordCount={game.puzzle.words.length}
          duration={formatGameDuration(game.elapsedSeconds)}
          saveState={game.saveState}
          saveError={game.saveError}
          onRetrySave={() => {
            game.retrySave();
          }}
          onPlayAgain={setup.startGame}
          onViewHistory={history.view}
        />
      ) : (
        <WordSearchPlayingBoard
          letters={game.puzzle.letters}
          words={game.puzzle.words}
          gridSize={setup.gridSize}
          foundIds={game.foundIds}
          foundWordPaths={game.foundWordPaths}
          selectedCells={game.selectedCells}
          vocabularyById={game.vocabularyById}
          onClearSelection={game.clearSelection}
          onPointerDown={game.onPointerDown}
          onPointerMove={game.onPointerMove}
          onPointerUp={game.onPointerUp}
          onPointerCancel={game.onPointerCancel}
        />
      )}
    </div>
  );
}

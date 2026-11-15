import { Card } from "@/components/ui/Card";
import { WordSearchBoard } from "@/components/games/WordSearchBoard";
import { WordSearchWordList } from "@/components/games/WordSearchWordList";
import type { VocabularyWord } from "@/data/vocabulary";
import type { CellPosition } from "@/hooks/useWordSearchSelection";
import type { GridSize } from "@/lib/word-search-config";

interface WordSearchPlayingBoardProps {
  letters: string[][];
  words: Array<{ id: string; word: string }>;
  gridSize: GridSize;
  foundIds: Set<string>;
  foundWordPaths: Record<string, CellPosition[]>;
  selectedCells: CellPosition[];
  vocabularyById: Map<string, VocabularyWord>;
  onClearSelection: () => void;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (event: React.PointerEvent<HTMLDivElement>) => void;
}

export function WordSearchPlayingBoard({
  letters,
  words,
  gridSize,
  foundIds,
  foundWordPaths,
  selectedCells,
  vocabularyById,
  onClearSelection,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: WordSearchPlayingBoardProps) {
  return (
    <div className="word-search-game-layout grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_250px]">
      <WordSearchBoard
        letters={letters}
        gridSize={gridSize}
        foundCount={foundIds.size}
        totalWords={words.length}
        foundWordPaths={foundWordPaths}
        selectedCells={selectedCells}
        onClearSelection={onClearSelection}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      />

      <Card className="word-search-words-card order-1 p-5 lg:order-2">
        <h2 className="font-semibold text-slate-950">Words to find</h2>
        <p className="mt-1 text-xs text-slate-500 hidden md:block">Find them in any order.</p>
        <WordSearchWordList words={words} vocabularyById={vocabularyById} foundIds={foundIds} />
      </Card>
    </div>
  );
}

"use client";

import { Card } from "@/components/ui/Card";
import { WordSearchHistoryDetail } from "@/components/games/WordSearchHistoryDetail";
import { WordSearchHistoryList } from "@/components/games/WordSearchHistoryList";
import type { VocabularyWord } from "@/data/vocabulary";
import type { WordSearchSessionRow } from "@/types/database";

export function WordSearchHistoryView({
  selectedHistory,
  history,
  historyTotal,
  historyPage,
  historyLoading,
  historyError,
  fastestSeconds,
  averageWordsPerRound,
  vocabularyByWord,
  onBack,
  onPlay,
  onSelect,
  onRefresh,
  onPageChange,
}: {
  selectedHistory: WordSearchSessionRow | null;
  history: WordSearchSessionRow[];
  historyTotal: number;
  historyPage: number;
  historyLoading: boolean;
  historyError: string;
  fastestSeconds: number | null;
  averageWordsPerRound: number;
  vocabularyByWord: Map<string, VocabularyWord>;
  onBack: () => void;
  onPlay: () => void;
  onSelect: (session: WordSearchSessionRow) => void;
  onRefresh: () => void;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="word-search-history-page">
      {selectedHistory ? (
        <WordSearchHistoryDetail
          session={selectedHistory}
          vocabularyByWord={vocabularyByWord}
          onBack={onBack}
          onPlayAgain={onPlay}
        />
      ) : (
        <Card className="word-search-history-dashboard overflow-hidden p-0">
          <WordSearchHistoryList
            history={history}
            historyTotal={historyTotal}
            historyPage={historyPage}
            historyLoading={historyLoading}
            historyError={historyError}
            fastestSeconds={fastestSeconds}
            averageWordsPerRound={averageWordsPerRound}
            onRefresh={onRefresh}
            onPlay={onPlay}
            onSelect={onSelect}
            onPageChange={onPageChange}
          />
        </Card>
      )}
    </div>
  );
}

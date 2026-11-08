import { useCallback, useState, type Dispatch, type SetStateAction } from "react";

import type { QuizPhase, QuizTab } from "@/lib/quiz-model";
import type { VocabularyQuizSessionRow } from "@/types/database";

export function useQuizNavigation({
  setPhase,
  setStartedAt,
  setSelectedHistory,
  loadHistory,
}: {
  setPhase: Dispatch<SetStateAction<QuizPhase>>;
  setStartedAt: Dispatch<SetStateAction<number | null>>;
  setSelectedHistory: Dispatch<SetStateAction<VocabularyQuizSessionRow | null>>;
  loadHistory: (forceRefresh?: boolean) => Promise<void>;
}) {
  const [tab, setTab] = useState<QuizTab>("play");

  const showPlayTab = useCallback(() => {
    setTab("play");
    setSelectedHistory(null);
  }, [setSelectedHistory]);

  const showHistoryTab = useCallback(() => {
    setTab("history");
    setSelectedHistory(null);
    void loadHistory();
  }, [loadHistory, setSelectedHistory]);

  const backToSetup = useCallback(() => {
    setStartedAt(null);
    setPhase("setup");
  }, [setPhase, setStartedAt]);

  return { tab, showPlayTab, showHistoryTab, backToSetup };
}

import { useCallback, useState, type Dispatch, type SetStateAction } from "react";

import type { QuizTab } from "@/lib/quiz-model";
import type { VocabularyQuizSessionRow } from "@/types/database";

export function useQuizNavigation({
  exitQuiz,
  setSelectedHistory,
  loadHistory,
}: {
  exitQuiz: () => void;
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
    exitQuiz();
  }, [exitQuiz]);

  return { tab, showPlayTab, showHistoryTab, backToSetup };
}

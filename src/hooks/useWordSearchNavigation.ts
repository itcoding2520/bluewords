import type { GamePhase, GameTab } from "@/types/game";
import { useState, type Dispatch, type SetStateAction } from "react";
import type { WordSearchSessionRow } from "@/types/database";

type Phase = GamePhase;
type Tab = GameTab;

export function useWordSearchNavigation({
  setPhase,
  setHistoryPage,
  loadHistory,
}: {
  setPhase: Dispatch<SetStateAction<Phase>>;
  setHistoryPage: Dispatch<SetStateAction<number>>;
  loadHistory: (forceRefresh?: boolean, page?: number) => Promise<void>;
}) {
  const [tab, setTab] = useState<Tab>("play");
  const [selectedHistory, setSelectedHistory] = useState<WordSearchSessionRow | null>(null);

  function openPlayTab() {
    setTab("play");
    setSelectedHistory(null);
  }

  function openHistoryTab() {
    setTab("history");
    setSelectedHistory(null);
    void loadHistory();
  }

  function viewHistory() {
    setPhase("setup");
    setTab("history");
    setHistoryPage(1);
    setSelectedHistory(null);
    void loadHistory(true, 1);
  }

  function changeHistoryPage(page: number) {
    setHistoryPage(page);
    void loadHistory(false, page);
  }

  return { tab, selectedHistory, setSelectedHistory, openPlayTab, openHistoryTab, viewHistory, changeHistoryPage };
}

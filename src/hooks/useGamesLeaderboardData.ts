import { useEffect, useState } from "react";
import type { LeaderboardFilters } from "@/lib/games/leaderboard-filters";
import { loadGamesLeaderboard } from "@/lib/games/load-leaderboard";
import {
  type QuizLeaderboardRow,
  type VocabularyGameLeaderboardRow,
  type WordSearchLeaderboardRow,
} from "@/lib/supabase/game-leaderboard";

export type GamesLeaderboardRow =
  | QuizLeaderboardRow
  | WordSearchLeaderboardRow
  | VocabularyGameLeaderboardRow;

export function useGamesLeaderboardData(filters: LeaderboardFilters) {
  const [rows, setRows] = useState<GamesLeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    void loadGamesLeaderboard(filters).then((result) => {
      if (active) setRows(result);
    }).catch(() => {
      if (active) {
        setRows([]);
        setError("Could not load the leaderboard. Please try again.");
      }
    }).finally(() => {
      if (active) {
        setLoading(false);
        setRefreshing(false);
      }
    });

    return () => { active = false; };
  }, [filters, reloadKey]);

  function prepareFilterChange() {
    setLoading(true);
    setError("");
  }

  function refresh() {
    setLoading(true);
    setError("");
    setRefreshing(true);
    setReloadKey((key) => key + 1);
  }

  return {
    rows,
    loading,
    refreshing,
    error,
    prepareFilterChange,
    refresh,
  };
}

import { useEffect, useState } from "react";

import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { useCommunicationCatalogPreferences } from "@/hooks/useCommunicationCatalogPreferences";
import {
  getCachedCommunicationCatalogSnapshot,
  getCommunicationCatalogCache,
} from "@/lib/supabase/communication-catalog-cache";
import { loadCommunicationCatalogSnapshot } from "@/lib/supabase/load-communication-catalog";
import type { SituationalEnglishCatalogSnapshot } from "@/lib/communication/catalog-types";
import type { Goal } from "@/lib/communication/catalog-types";

export type { Goal, Lesson, LessonAccuracy, Progress, ReviewItem, Topic } from "@/lib/communication/catalog-types";

type CatalogData = Pick<
  SituationalEnglishCatalogSnapshot,
  | "topics"
  | "lessons"
  | "progress"
  | "lessonAccuracy"
  | "todayCompleted"
  | "dueItems"
  | "authenticated"
>;

const emptyCatalogData: CatalogData = {
  topics: [],
  lessons: [],
  progress: [],
  lessonAccuracy: {},
  todayCompleted: 0,
  dueItems: [],
  authenticated: false,
};

export function useSituationalEnglishCatalogData() {
  const supabase = useSupabaseClient();
  const [catalogData, setCatalogData] = useState<CatalogData>(emptyCatalogData);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [dailyGoal, setDailyGoal] = useState(1);
  const [loading, setLoading] = useState(true);
  const preferences = useCommunicationCatalogPreferences({
    supabase,
    authenticated: catalogData.authenticated,
    setGoal,
    setDailyGoal,
  });

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError) throw authError;
        const userId = session?.user.id ?? null;
        const cacheKey = userId ?? "guest";
        const applySnapshot = (snapshot: SituationalEnglishCatalogSnapshot) => {
          setCatalogData(snapshot);
          setGoal(snapshot.goal);
          setDailyGoal(snapshot.dailyGoal);
        };

        const cachedSnapshot = getCachedCommunicationCatalogSnapshot<SituationalEnglishCatalogSnapshot>(cacheKey);
        if (cachedSnapshot && active) {
          applySnapshot(cachedSnapshot);
          setLoading(false);
        }

        const snapshot = await getCommunicationCatalogCache(cacheKey, () =>
          loadCommunicationCatalogSnapshot(supabase, userId)
        );
        if (!active) return;
        applySnapshot(snapshot);
      } catch (error) {
        console.error("Failed to load situational English catalog", error);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [supabase]);

  return {
    topics: catalogData.topics,
    lessons: catalogData.lessons,
    progress: catalogData.progress,
    lessonAccuracy: catalogData.lessonAccuracy,
    goal,
    dailyGoal,
    todayCompleted: catalogData.todayCompleted,
    dueItems: catalogData.dueItems,
    loading,
    authenticated: catalogData.authenticated,
    ...preferences,
  };
}

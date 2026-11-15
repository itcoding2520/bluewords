import { useEffect, useState } from "react";

import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { useCommunicationCatalogPreferences } from "@/hooks/useCommunicationCatalogPreferences";
import {
  getCachedCommunicationCatalogSnapshot,
  getCommunicationCatalogCache,
} from "@/lib/supabase/communication-catalog-cache";
import { loadCommunicationCatalogSnapshot } from "@/lib/supabase/load-communication-catalog";
import type { SituationalEnglishCatalogSnapshot } from "@/lib/communication/catalog-types";
import type { Goal, Lesson, LessonAccuracy, Progress, ReviewItem, Topic } from "@/lib/communication/catalog-types";

export type { Goal, Lesson, LessonAccuracy, Progress, ReviewItem, Topic } from "@/lib/communication/catalog-types";

export function useSituationalEnglishCatalogData() {
  const supabase = useSupabaseClient();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [lessonAccuracy, setLessonAccuracy] = useState<LessonAccuracy>({});
  const [goal, setGoal] = useState<Goal | null>(null);
  const [dailyGoal, setDailyGoal] = useState(1);
  const [todayCompleted, setTodayCompleted] = useState(0);
  const [dueItems, setDueItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const preferences = useCommunicationCatalogPreferences({ supabase, authenticated, setGoal, setDailyGoal });

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError) throw authError;
        const userId = session?.user.id ?? null;
        const cacheKey = userId ?? "guest";
        const applySnapshot = (snapshot: SituationalEnglishCatalogSnapshot) => {
          setAuthenticated(snapshot.authenticated);
          setTopics(snapshot.topics);
          setLessons(snapshot.lessons);
          setProgress(snapshot.progress);
          setLessonAccuracy(snapshot.lessonAccuracy);
          setGoal(snapshot.goal);
          setDailyGoal(snapshot.dailyGoal);
          setTodayCompleted(snapshot.todayCompleted);
          setDueItems(snapshot.dueItems);
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
    topics,
    lessons,
    progress,
    lessonAccuracy,
    goal,
    dailyGoal,
    todayCompleted,
    dueItems,
    loading,
    authenticated,
    ...preferences,
  };
}

"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import type { SupabaseClient } from "@/lib/supabase/client";
import { invalidateCommunicationCatalogCache } from "@/lib/supabase/communication-catalog-cache";
import { attachDialogueTurns } from "@/lib/communication/dialogue-utils";
import { loadSituationalEnglishLessonBase } from "@/lib/supabase/situational-english-lesson-base";
import {
  loadSituationalEnglishDialogueTurns,
  loadSituationalEnglishLearnerProgress,
  startSituationalEnglishLessonProgress,
} from "@/lib/supabase/situational-english-lesson-queries";
import { useSituationalEnglishLessonNavigation } from "@/hooks/useSituationalEnglishLessonNavigation";

import type { Lesson, Topic, Item, Dialogue, Turn, ItemReview } from "@/lib/communication/lesson-types";


export function useSituationalEnglishLessonData(
  supabase: SupabaseClient,
  lessonId: string,
  reviewItem?: string,
) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [dialogues, setDialogues] = useState<Array<Dialogue & { turns: Turn[] }>>([]);
  const [reviews, setReviews] = useState<Record<string, ItemReview>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const {
    currentIndex,
    setCurrentIndex,
    practiceOrder,
    setPracticeOrder,
    initializeNavigation,
  } = useSituationalEnglishLessonNavigation();

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const base = await loadSituationalEnglishLessonBase(supabase, lessonId);
        if (!base) { if (active) setLesson(null); return; }
        if (!active) return;

        const { lesson: currentLesson, items: loadedItems, dialogues: foundDialogues, userId: loadedUserId } = base;
        setLesson(currentLesson);
        setTopic(base.topic);
        setItems(loadedItems);
        setUserId(loadedUserId);
        initializeNavigation(loadedItems, reviewItem);

        const user = loadedUserId ? { id: loadedUserId } : null;
        const dialogueTurnsRequest = loadSituationalEnglishDialogueTurns(
          supabase,
          foundDialogues.map((dialogue) => dialogue.id)
        );
        const learnerProgressRequest = user
          ? loadSituationalEnglishLearnerProgress(
            supabase,
            user.id,
            lessonId,
            loadedItems.map((item) => item.id)
          )
          : null;

        const [turnsResult, learnerProgressResult] = await Promise.all([
          dialogueTurnsRequest,
          learnerProgressRequest,
        ]);

        if (turnsResult) {
          if (turnsResult.error) throw turnsResult.error;
          const turns = (turnsResult.data ?? []) as (Turn & { dialogue_id: string })[];
          if (active) setDialogues(attachDialogueTurns(foundDialogues, turns));
        }

        if (user && learnerProgressResult) {
          const [reviewResult, progressResult] = learnerProgressResult;
          if (reviewResult.error) throw reviewResult.error;
          if (active) setReviews(Object.fromEntries((reviewResult.data ?? []).map((row) => [row.item_id, { status: row.status, review_count: row.review_count, correct_count: row.correct_count }])));
          const initializeProgress = !progressResult.error && !progressResult.data;
          const resumeProgress = progressResult.data?.status === "not_started";
          if (initializeProgress || resumeProgress) {
            const { error } = await startSituationalEnglishLessonProgress(
              supabase,
              user.id,
              lessonId,
              resumeProgress,
            );
            if (!error) invalidateCommunicationCatalogCache(user.id);
          }
        }
      } catch (error) {
        console.error("Failed to load situational English lesson", error);
        toast.error("Could not load this lesson.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; window.speechSynthesis?.cancel(); };
  }, [initializeNavigation, lessonId, reviewItem, supabase]);

  return { lesson, topic, items, dialogues, reviews, setReviews, userId, loading, currentIndex, setCurrentIndex, practiceOrder, setPracticeOrder };
}

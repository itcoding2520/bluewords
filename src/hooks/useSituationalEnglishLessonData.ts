"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import type { createClient } from "@/lib/supabase/client";
import { invalidateCommunicationCatalogCache } from "@/lib/supabase/communication-catalog-cache";
import { shuffled } from "@/lib/communication/lesson-practice";
import { attachDialogueTurns } from "@/lib/communication/dialogue-utils";

export type Lesson = { id: string; topic_id: string; title_en: string; title_vi: string; difficulty: "easy" | "medium" | "hard"; status: string };
export type Topic = { id: string; title_en: string; title_vi: string };
export type Item = { id: string; item_key: string; item_type: "word" | "phrase" | "sentence_pattern"; content_en: string; meaning_vi: string; example_en: string; example_vi: string; image_keyword: string; audio_url: string; sort_order: number };
export type Dialogue = { id: string; title_en: string; title_vi: string; prompt_vi: string; sort_order: number };
export type Turn = { id: string; speaker: string; text_en: string; meaning_vi: string; audio_url: string; response_prompt_vi: string; expected_response: string; response_options: string[]; turn_order: number };
export type ItemReview = { status: "learning" | "mastered"; review_count: number; correct_count: number };

type SupabaseClient = ReturnType<typeof createClient>;

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [practiceOrder, setPracticeOrder] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const lessonResult = await supabase.from("communication_lessons").select("id,topic_id,title_en,title_vi,difficulty,status").eq("id", lessonId).eq("status", "published").maybeSingle();
        if (lessonResult.error) throw lessonResult.error;
        if (!lessonResult.data) { if (active) setLesson(null); return; }
        const currentLesson = lessonResult.data as Lesson;
        const [topicResult, itemResult, dialogueResult, authResult] = await Promise.all([
          supabase.from("communication_topics").select("id,title_en,title_vi").eq("id", currentLesson.topic_id).eq("status", "published").maybeSingle(),
          supabase.from("communication_lesson_items").select("id,item_key,item_type,content_en,meaning_vi,example_en,example_vi,image_keyword,audio_url,sort_order").eq("lesson_id", lessonId).order("sort_order"),
          supabase.from("communication_dialogues").select("id,title_en,title_vi,prompt_vi,sort_order").eq("lesson_id", lessonId).order("sort_order"),
          supabase.auth.getUser(),
        ]);
        if (topicResult.error) throw topicResult.error;
        if (itemResult.error) throw itemResult.error;
        if (dialogueResult.error) throw dialogueResult.error;
        if (!active) return;

        const loadedItems = (itemResult.data ?? []) as Item[];
        setLesson(currentLesson);
        setTopic(topicResult.data as Topic | null);
        setItems(loadedItems);
        setUserId(authResult.data.user?.id ?? null);
        setPracticeOrder(shuffled(loadedItems.map((item) => item.id)));
        if (reviewItem) {
          const dueIndex = loadedItems.findIndex((item) => item.id === reviewItem);
          if (dueIndex >= 0) setCurrentIndex(dueIndex);
        }

        const foundDialogues = (dialogueResult.data ?? []) as Dialogue[];
        const user = authResult.data.user;
        const dialogueTurnsRequest = foundDialogues.length
          ? supabase.from("communication_dialogue_turns").select("id,dialogue_id,speaker,text_en,meaning_vi,audio_url,response_prompt_vi,expected_response,response_options,turn_order").in("dialogue_id", foundDialogues.map((dialogue) => dialogue.id)).order("turn_order")
          : null;
        const learnerProgressRequest = user
          ? Promise.all([
            supabase.from("communication_item_reviews").select("item_id,status,review_count,correct_count").eq("user_id", user.id).in("item_id", loadedItems.map((item) => item.id)),
            supabase.from("communication_lesson_progress").select("status").eq("user_id", user.id).eq("lesson_id", lessonId).maybeSingle(),
          ])
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
          if (!progressResult.error && !progressResult.data) {
            const { error } = await supabase.from("communication_lesson_progress").upsert({ user_id: user.id, lesson_id: lessonId, status: "in_progress", started_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: "user_id,lesson_id" });
            if (!error) invalidateCommunicationCatalogCache(user.id);
          } else if (progressResult.data?.status === "not_started") {
            const { error } = await supabase.from("communication_lesson_progress").update({ status: "in_progress", started_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("user_id", user.id).eq("lesson_id", lessonId);
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
  }, [lessonId, reviewItem, supabase]);

  return { lesson, topic, items, dialogues, reviews, setReviews, userId, loading, currentIndex, setCurrentIndex, practiceOrder, setPracticeOrder };
}

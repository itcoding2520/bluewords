"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import type { SupabaseClient } from "@/lib/supabase/client";
import type {
  CommunicationCollections,
  CommunicationLesson,
  CommunicationLessonItem,
  CommunicationTopic,
} from "@/lib/supabase/communication-admin-types";
import { loadAdminCommunicationCollections } from "@/lib/communication/admin-collections";


export function useAdminCommunicationCollections(supabase: SupabaseClient) {
  const [topics, setTopics] = useState<CommunicationTopic[]>([]);
  const [lessons, setLessons] = useState<CommunicationLesson[]>([]);
  const [items, setItems] = useState<CommunicationLessonItem[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [loading, setLoading] = useState(true);

  const loadCollections = useCallback(async (force = false): Promise<CommunicationCollections> => {
    return loadAdminCommunicationCollections(supabase, force);
  }, [supabase]);

  const applyCollections = useCallback((next: CommunicationCollections) => {
    setTopics(next.topics);
    setLessons(next.lessons);
    setItems(next.items);

    const nextTopicId = next.topics.some((topic) => topic.id === selectedTopicId)
      ? selectedTopicId
      : next.topics[0]?.id ?? "";
    setSelectedTopicId(nextTopicId);
    setSelectedLessonId((currentLessonId) => next.lessons.some(
      (lesson) => lesson.id === currentLessonId && lesson.topic_id === nextTopicId,
    ) ? currentLessonId : next.lessons.find((lesson) => lesson.topic_id === nextTopicId)?.id ?? "");
  }, [selectedTopicId]);

  const refresh = useCallback(async () => {
    try {
      applyCollections(await loadCollections(true));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load communication content.");
    }
  }, [applyCollections, loadCollections]);

  useEffect(() => {
    let active = true;
    void loadCollections()
      .then((result) => { if (active) applyCollections(result); })
      .catch((error: unknown) => {
        if (active) toast.error(error instanceof Error ? error.message : "Could not load communication content.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
    // Load once on mount; manual refresh uses the latest selected situation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    topics,
    lessons,
    items,
    selectedTopicId,
    setSelectedTopicId,
    selectedLessonId,
    setSelectedLessonId,
    loading,
    refresh,
  };
}

"use client";

import { getErrorMessage } from "@/lib/errors";
import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";

import type { SupabaseClient } from "@/lib/supabase/client";
import type { CommunicationCollections } from "@/lib/supabase/communication-admin-types";
import { loadAdminCommunicationCollections } from "@/lib/communication/admin-collections";


export function useAdminCommunicationCollections(supabase: SupabaseClient) {
  const [state, setState] = useState({
    collections: {
      topics: [],
      lessons: [],
      items: [],
    } as CommunicationCollections,
    selectedTopicId: "",
    selectedLessonId: "",
  });
  const [loading, setLoading] = useState(true);
  const { collections, selectedTopicId, selectedLessonId } = state;

  const loadCollections = useCallback(async (force = false): Promise<CommunicationCollections> => {
    return loadAdminCommunicationCollections(supabase, force);
  }, [supabase]);

  const applyCollections = useCallback((next: CommunicationCollections) => {
    setState((current) => {
      const nextTopicId = next.topics.some((topic) => topic.id === current.selectedTopicId)
        ? current.selectedTopicId
        : next.topics[0]?.id ?? "";
      const nextLessonId = next.lessons.some(
        (lesson) => lesson.id === current.selectedLessonId && lesson.topic_id === nextTopicId,
      ) ? current.selectedLessonId : next.lessons.find(
        (lesson) => lesson.topic_id === nextTopicId,
      )?.id ?? "";
      return {
        collections: next,
        selectedTopicId: nextTopicId,
        selectedLessonId: nextLessonId,
      };
    });
  }, []);

  const setSelectedTopicId: Dispatch<SetStateAction<string>> = useCallback((value) => {
    setState((current) => ({
      ...current,
      selectedTopicId: typeof value === "function" ? value(current.selectedTopicId) : value,
    }));
  }, []);
  const setSelectedLessonId: Dispatch<SetStateAction<string>> = useCallback((value) => {
    setState((current) => ({
      ...current,
      selectedLessonId: typeof value === "function" ? value(current.selectedLessonId) : value,
    }));
  }, []);

  const refresh = useCallback(async () => {
    try {
      applyCollections(await loadCollections(true));
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not load communication content."));
    }
  }, [applyCollections, loadCollections]);

  useEffect(() => {
    let active = true;
    void loadCollections()
      .then((result) => { if (active) applyCollections(result); })
      .catch((error: unknown) => {
        if (active) toast.error(getErrorMessage(error, "Could not load communication content."));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [applyCollections, loadCollections]);

  return {
    topics: collections.topics,
    lessons: collections.lessons,
    items: collections.items,
    selectedTopicId,
    setSelectedTopicId,
    selectedLessonId,
    setSelectedLessonId,
    loading,
    refresh,
  };
}

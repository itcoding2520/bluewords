import { useMemo } from "react";

import { getCommunicationTopicWordCounts } from "@/lib/communication/topic-word-counts";
import type { CommunicationLesson, CommunicationLessonItem, CommunicationTopic } from "@/lib/supabase/communication-admin-types";

export function useAdminCommunicationTopicView({
  topics,
  lessons,
  items,
  search,
}: {
  topics: CommunicationTopic[];
  lessons: CommunicationLesson[];
  items: CommunicationLessonItem[];
  search: string;
}) {
  const normalizedSearch = search.toLowerCase();
  const filteredTopics = useMemo(
    () => topics.filter((topic) =>
      `${topic.title_en} ${topic.title_vi} ${topic.slug}`.toLowerCase().includes(normalizedSearch),
    ),
    [topics, normalizedSearch],
  );
  const topicWordCounts = useMemo(() => getCommunicationTopicWordCounts(lessons, items), [items, lessons]);

  return { filteredTopics, topicWordCounts };
}

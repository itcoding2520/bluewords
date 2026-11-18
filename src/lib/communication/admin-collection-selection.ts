import type { CommunicationCollections } from "@/lib/supabase/communication-admin-types";

export function reconcileCommunicationCollectionSelection(
  collections: CommunicationCollections,
  currentTopicId: string,
  currentLessonId: string,
) {
  const selectedTopicId = collections.topics.some((topic) => topic.id === currentTopicId)
    ? currentTopicId
    : collections.topics[0]?.id ?? "";
  const lessons = collections.lessons.filter((lesson) => lesson.topic_id === selectedTopicId);
  const selectedLessonId = lessons.some((lesson) => lesson.id === currentLessonId)
    ? currentLessonId
    : lessons[0]?.id ?? "";

  return { selectedTopicId, selectedLessonId };
}

import type { CommunicationDifficulty } from "@/lib/communication/content-types";
import type { CommunicationLesson, CommunicationLessonItem } from "@/lib/supabase/communication-admin-types";

export type TopicWordCounts = Record<CommunicationDifficulty, number>;

export function getCommunicationContentCounts(
  lessons: CommunicationLesson[],
  items: CommunicationLessonItem[],
) {
  const lessonCountsByTopic = new Map<string, number>();
  const itemCountsByLesson = new Map<string, number>();
  const lessonsById = new Map<string, Pick<CommunicationLesson, "topic_id" | "difficulty">>();
  const wordsByTopic = new Map<string, Record<CommunicationDifficulty, Set<string>>>();
  for (const lesson of lessons) {
    lessonCountsByTopic.set(lesson.topic_id, (lessonCountsByTopic.get(lesson.topic_id) ?? 0) + 1);
    lessonsById.set(lesson.id, lesson);
    if (!wordsByTopic.has(lesson.topic_id)) {
      wordsByTopic.set(lesson.topic_id, {
        easy: new Set<string>(),
        medium: new Set<string>(),
        hard: new Set<string>(),
      });
    }
  }

  for (const item of items) {
    itemCountsByLesson.set(item.lesson_id, (itemCountsByLesson.get(item.lesson_id) ?? 0) + 1);
    if (item.item_type !== "word") continue;
    const lesson = lessonsById.get(item.lesson_id);
    if (!lesson) continue;
    wordsByTopic.get(lesson.topic_id)?.[lesson.difficulty].add(item.content_en.trim().toLocaleLowerCase());
  }

  const topicWordCounts = new Map<string, TopicWordCounts>([...wordsByTopic].map(([topicId, levels]) => [topicId, {
    easy: levels.easy.size,
    medium: levels.medium.size,
    hard: levels.hard.size,
  }]));

  return { lessonCountsByTopic, itemCountsByLesson, topicWordCounts };
}

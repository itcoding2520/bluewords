import type { CommunicationDifficulty } from "@/lib/communication/content-types";
import type { CommunicationLesson, CommunicationLessonItem } from "@/lib/supabase/communication-admin-types";

export type TopicWordCounts = Record<CommunicationDifficulty, number>;

export function getCommunicationContentCounts(
  lessons: CommunicationLesson[],
  items: CommunicationLessonItem[],
) {
  const lessonCountsByTopic = new Map<string, number>();
  const itemCountsByLesson = new Map<string, number>();
  const wordsByLesson = new Map<string, Set<string>>();

  for (const item of items) {
    itemCountsByLesson.set(item.lesson_id, (itemCountsByLesson.get(item.lesson_id) ?? 0) + 1);
    if (item.item_type !== "word") continue;
    const words = wordsByLesson.get(item.lesson_id) ?? new Set<string>();
    words.add(item.content_en.trim().toLocaleLowerCase());
    wordsByLesson.set(item.lesson_id, words);
  }

  const wordsByTopic = new Map<string, Record<CommunicationDifficulty, Set<string>>>();
  for (const lesson of lessons) {
    lessonCountsByTopic.set(lesson.topic_id, (lessonCountsByTopic.get(lesson.topic_id) ?? 0) + 1);
    const levels = wordsByTopic.get(lesson.topic_id) ?? {
      easy: new Set<string>(),
      medium: new Set<string>(),
      hard: new Set<string>(),
    };
    for (const word of wordsByLesson.get(lesson.id) ?? []) levels[lesson.difficulty].add(word);
    wordsByTopic.set(lesson.topic_id, levels);
  }

  const topicWordCounts = new Map<string, TopicWordCounts>([...wordsByTopic].map(([topicId, levels]) => [topicId, {
    easy: levels.easy.size,
    medium: levels.medium.size,
    hard: levels.hard.size,
  }]));

  return { lessonCountsByTopic, itemCountsByLesson, topicWordCounts };
}

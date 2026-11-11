import { useMemo } from "react";
import type { Lesson, Progress, Topic } from "@/hooks/useSituationalEnglishCatalogData";

export function useSituationalEnglishCatalogView({
  topics,
  lessons,
  progress,
  difficulty,
  search,
}: {
  topics: Topic[];
  lessons: Lesson[];
  progress: Progress[];
  difficulty: string;
  search: string;
}) {
  const lessonsByTopic = useMemo(() => {
    const grouped = new Map<string, Lesson[]>();
    for (const lesson of lessons) {
      const group = grouped.get(lesson.topic_id) ?? [];
      group.push(lesson);
      grouped.set(lesson.topic_id, group);
    }
    return grouped;
  }, [lessons]);

  const visibleLessonsByTopic = useMemo(() => {
    const visible = new Map<string, Lesson[]>();
    for (const [topicId, topicLessons] of lessonsByTopic) {
      visible.set(topicId, topicLessons.filter((lesson) => difficulty === "all" || lesson.difficulty === difficulty));
    }
    return visible;
  }, [lessonsByTopic, difficulty]);

  const progressByLesson = useMemo(
    () => new Map(progress.map((row) => [row.lesson_id, row])),
    [progress],
  );

  const completedLevelsByTopic = useMemo(() => {
    const completed = new Map<string, Set<Lesson["difficulty"]>>();
    for (const lesson of lessons) {
      if (progressByLesson.get(lesson.id)?.status !== "completed") continue;
      const levels = completed.get(lesson.topic_id) ?? new Set<Lesson["difficulty"]>();
      levels.add(lesson.difficulty);
      completed.set(lesson.topic_id, levels);
    }
    return completed;
  }, [lessons, progressByLesson]);

  const visibleTopics = useMemo(() => {
    const normalizedSearch = search.toLowerCase();
    return topics.filter((topic) => {
      const textMatches = `${topic.title_en} ${topic.title_vi} ${topic.description_en}`.toLowerCase().includes(normalizedSearch);
      return textMatches && (visibleLessonsByTopic.get(topic.id)?.length ?? 0) > 0;
    });
  }, [topics, visibleLessonsByTopic, search]);

  return { visibleTopics, visibleLessonsByTopic, progressByLesson, completedLevelsByTopic };
}

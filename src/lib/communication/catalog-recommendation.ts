import type { DifficultyLevel } from "@/types/difficulty";

type Lesson = {
  id: string;
  topic_id: string;
  difficulty: DifficultyLevel;
};

type Progress = {
  lesson_id: string;
  status: "not_started" | "in_progress" | "completed";
};

type DueItem = {
  item_id: string;
  lesson_id: string;
};

type LessonAccuracy = Record<string, { correct: number; attempts: number }>;

export function getCatalogRecommendation({
  lessons,
  progress,
  lessonAccuracy,
  dueItems,
}: {
  lessons: Lesson[];
  progress: Progress[];
  lessonAccuracy: LessonAccuracy;
  dueItems: DueItem[];
}) {
  const nextDueItem = dueItems[0];
  const completedLessonIds = new Set<string>();
  const inProgressLessonIds = new Set<string>();
  for (const row of progress) {
    if (row.status === "completed") completedLessonIds.add(row.lesson_id);
    if (row.status === "in_progress") inProgressLessonIds.add(row.lesson_id);
  }
  const inProgressLesson = lessons.find((lesson) => inProgressLessonIds.has(lesson.id));
  const incompleteLesson = lessons.find((lesson) => !completedLessonIds.has(lesson.id));
  const difficultyRank: Record<DifficultyLevel, number> = { easy: 0, medium: 1, hard: 2 };
  const reviewedLessons = lessons.flatMap((lesson) => {
    const stats = lessonAccuracy[lesson.id];
    return stats && stats.attempts >= 3 ? [{ lesson, accuracy: stats.correct / stats.attempts }] : [];
  });
  let weakestLesson = reviewedLessons[0];
  let strongestLesson = reviewedLessons[0];
  for (const reviewedLesson of reviewedLessons.slice(1)) {
    if (reviewedLesson.accuracy < weakestLesson.accuracy) weakestLesson = reviewedLesson;
    if (reviewedLesson.accuracy > strongestLesson.accuracy) strongestLesson = reviewedLesson;
  }
  let adaptiveLesson: Lesson | undefined;
  let adaptiveLabel = "";
  let adaptiveReason = "";

  if (weakestLesson && weakestLesson.accuracy < 0.7) {
    adaptiveLesson = lessons.find((lesson) => lesson.topic_id === weakestLesson.lesson.topic_id
      && difficultyRank[lesson.difficulty] < difficultyRank[weakestLesson.lesson.difficulty]
      && !completedLessonIds.has(lesson.id));
    adaptiveLesson ??= weakestLesson.lesson;
    adaptiveLabel = adaptiveLesson.id === weakestLesson.lesson.id ? "Practice again" : "Try an easier lesson";
    adaptiveReason = "Your recent answers show this topic could use a little more practice.";
  } else if (strongestLesson && strongestLesson.accuracy >= 0.9) {
    adaptiveLesson = lessons.find((lesson) => lesson.topic_id === strongestLesson.lesson.topic_id
      && difficultyRank[lesson.difficulty] > difficultyRank[strongestLesson.lesson.difficulty]
      && !completedLessonIds.has(lesson.id));
    if (adaptiveLesson) {
      adaptiveLabel = "Try a harder lesson";
      adaptiveReason = "Your recent answers show you are ready for the next level.";
    }
  }

  const suggestedLesson = inProgressLesson ?? adaptiveLesson ?? incompleteLesson;
  const nextStepHref = nextDueItem
    ? `/communication/${nextDueItem.lesson_id}?reviewItem=${encodeURIComponent(nextDueItem.item_id)}`
    : suggestedLesson ? `/communication/${suggestedLesson.id}` : null;
  const nextStepLabel = nextDueItem ? "Review due word" : inProgressLesson ? "Continue lesson" : adaptiveLesson ? adaptiveLabel : "Start next lesson";
  const nextStepReason = nextDueItem ? "An item is ready for review." : inProgressLesson ? "Pick up where you left off." : adaptiveLesson ? adaptiveReason : "Continue with the next lesson in your path.";

  return { nextDueItem, inProgressLesson, suggestedLesson, nextStepHref, nextStepLabel, nextStepReason };
}

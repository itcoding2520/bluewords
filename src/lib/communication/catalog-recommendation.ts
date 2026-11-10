type Lesson = {
  id: string;
  topic_id: string;
  difficulty: "easy" | "medium" | "hard";
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
  const inProgressLesson = lessons.find((lesson) =>
    progress.some((row) => row.lesson_id === lesson.id && row.status === "in_progress"),
  );
  const incompleteLesson = lessons.find((lesson) =>
    !progress.some((row) => row.lesson_id === lesson.id && row.status === "completed"),
  );
  const difficultyRank = { easy: 0, medium: 1, hard: 2 };
  const reviewedLessons = lessons.flatMap((lesson) => {
    const stats = lessonAccuracy[lesson.id];
    return stats && stats.attempts >= 3 ? [{ lesson, accuracy: stats.correct / stats.attempts }] : [];
  });
  const weakestLesson = [...reviewedLessons].sort((a, b) => a.accuracy - b.accuracy)[0];
  const strongestLesson = [...reviewedLessons].sort((a, b) => b.accuracy - a.accuracy)[0];
  let adaptiveLesson: Lesson | undefined;
  let adaptiveLabel = "";
  let adaptiveReason = "";

  if (weakestLesson && weakestLesson.accuracy < 0.7) {
    adaptiveLesson = lessons.find((lesson) => lesson.topic_id === weakestLesson.lesson.topic_id
      && difficultyRank[lesson.difficulty] < difficultyRank[weakestLesson.lesson.difficulty]
      && !progress.some((row) => row.lesson_id === lesson.id && row.status === "completed"));
    adaptiveLesson ??= weakestLesson.lesson;
    adaptiveLabel = adaptiveLesson.id === weakestLesson.lesson.id ? "Practice again" : "Try an easier lesson";
    adaptiveReason = "Your recent answers show this topic could use a little more practice.";
  } else if (strongestLesson && strongestLesson.accuracy >= 0.9) {
    adaptiveLesson = lessons.find((lesson) => lesson.topic_id === strongestLesson.lesson.topic_id
      && difficultyRank[lesson.difficulty] > difficultyRank[strongestLesson.lesson.difficulty]
      && !progress.some((row) => row.lesson_id === lesson.id && row.status === "completed"));
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

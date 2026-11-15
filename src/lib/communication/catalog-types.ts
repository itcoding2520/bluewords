export type Goal = "games" | "conversation";
export type Topic = { id: string; slug: string; title_en: string; title_vi: string; description_en: string; description_vi: string; sort_order: number };
export type Lesson = { id: string; topic_id: string; title_en: string; title_vi: string; difficulty: "easy" | "medium" | "hard"; sort_order: number };
export type Progress = { lesson_id: string; status: "not_started" | "in_progress" | "completed"; completed_items: number };
export type ReviewItem = { item_id: string; due_at: string; content_en: string; meaning_vi: string; lesson_id: string; lesson_title_en: string; lesson_title_vi: string };
export type LessonAccuracy = Record<string, { correct: number; attempts: number }>;

export type SituationalEnglishCatalogSnapshot = {
  topics: Topic[];
  lessons: Lesson[];
  progress: Progress[];
  lessonAccuracy: LessonAccuracy;
  goal: Goal | null;
  dailyGoal: number;
  todayCompleted: number;
  dueItems: ReviewItem[];
  authenticated: boolean;
};

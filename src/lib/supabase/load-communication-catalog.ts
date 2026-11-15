import type { createClient } from "@/lib/supabase/client";
import type { Goal, Progress, SituationalEnglishCatalogSnapshot, Topic } from "@/lib/communication/catalog-types";

type SupabaseClient = ReturnType<typeof createClient>;

function localDayStart() {
  const day = new Date();
  day.setHours(0, 0, 0, 0);
  return day.toISOString();
}

export async function loadCommunicationCatalogSnapshot(
  supabase: SupabaseClient,
  userId: string | null,
): Promise<SituationalEnglishCatalogSnapshot> {
  const [topicResult, lessonResult] = await Promise.all([
    supabase.from("communication_topics").select("id,slug,title_en,title_vi,description_en,description_vi,sort_order").eq("status", "published").order("sort_order"),
    supabase.from("communication_lessons").select("id,topic_id,title_en,title_vi,difficulty,sort_order,communication_topics!inner(status)").eq("status", "published").eq("communication_topics.status", "published").order("sort_order"),
  ]);
  if (topicResult.error) throw topicResult.error;
  if (lessonResult.error) throw lessonResult.error;

  const data: SituationalEnglishCatalogSnapshot = {
    topics: (topicResult.data ?? []) as unknown as Topic[],
    lessons: (lessonResult.data ?? []) as unknown as SituationalEnglishCatalogSnapshot["lessons"],
    progress: [],
    lessonAccuracy: {},
    goal: null,
    dailyGoal: 1,
    todayCompleted: 0,
    dueItems: [],
    authenticated: Boolean(userId),
  };
  if (!userId) return data;

  const [progressResult, preferenceResult, dailyGoalResult, completedResult, dueResult, accuracyResult] = await Promise.all([
    supabase.from("communication_lesson_progress").select("lesson_id,status,completed_items").eq("user_id", userId),
    supabase.from("communication_learning_preferences").select("learning_goal").eq("user_id", userId).maybeSingle(),
    supabase.from("communication_daily_goals").select("lessons_per_day").eq("user_id", userId).maybeSingle(),
    supabase.from("communication_lesson_progress").select("lesson_id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "completed").gte("completed_at", localDayStart()),
    supabase.from("communication_item_reviews").select("item_id,due_at").eq("user_id", userId).lte("due_at", new Date().toISOString()).order("due_at").limit(50),
    supabase.from("communication_item_reviews").select("review_count,correct_count,communication_lesson_items!inner(lesson_id)").eq("user_id", userId).gt("review_count", 0).order("last_reviewed_at", { ascending: false }).limit(500),
  ]);
  if (!progressResult.error) data.progress = (progressResult.data ?? []) as Progress[];
  if (!preferenceResult.error) data.goal = (preferenceResult.data?.learning_goal as Goal | undefined) ?? null;
  if (!dailyGoalResult.error) data.dailyGoal = dailyGoalResult.data?.lessons_per_day ?? 1;
  if (!completedResult.error) data.todayCompleted = completedResult.count ?? 0;
  if (dueResult.error) console.error("Failed to load due communication reviews", dueResult.error);
  if (accuracyResult.error) console.error("Failed to load communication review accuracy", accuracyResult.error);

  type ReviewAccuracyRow = { review_count: number; correct_count: number; communication_lesson_items: { lesson_id: string } | { lesson_id: string }[] };
  for (const row of (accuracyResult.data ?? []) as unknown as ReviewAccuracyRow[]) {
    const item = Array.isArray(row.communication_lesson_items) ? row.communication_lesson_items[0] : row.communication_lesson_items;
    if (!item) continue;
    const stats = data.lessonAccuracy[item.lesson_id] ?? { correct: 0, attempts: 0 };
    stats.correct += row.correct_count;
    stats.attempts += row.review_count;
    data.lessonAccuracy[item.lesson_id] = stats;
  }
  if (!dueResult.data?.length) return data;

  const itemResult = await supabase.from("communication_lesson_items").select("id,lesson_id,content_en,meaning_vi").in("id", dueResult.data.map((review) => review.item_id));
  if (itemResult.error) throw itemResult.error;
  const lessonIds = [...new Set((itemResult.data ?? []).map((item) => item.lesson_id))];
  const dueLessons = lessonIds.length
    ? await supabase.from("communication_lessons").select("id,title_en,title_vi").in("id", lessonIds).eq("status", "published")
    : { data: [], error: null };
  if (dueLessons.error) throw dueLessons.error;
  const lessonsById = new Map((dueLessons.data ?? []).map((lesson) => [lesson.id, lesson]));
  const dueAtById = new Map(dueResult.data.map((review) => [review.item_id, review.due_at]));
  data.dueItems = (itemResult.data ?? []).flatMap((item) => {
    const lesson = lessonsById.get(item.lesson_id);
    return lesson ? [{ item_id: item.id, due_at: dueAtById.get(item.id) ?? "", content_en: item.content_en, meaning_vi: item.meaning_vi, lesson_id: item.lesson_id, lesson_title_en: lesson.title_en, lesson_title_vi: lesson.title_vi }] : [];
  });
  return data;
}

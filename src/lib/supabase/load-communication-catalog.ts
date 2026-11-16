import type { SupabaseClient } from "@/lib/supabase/client";
import type { Goal, Lesson, Progress, SituationalEnglishCatalogSnapshot, Topic } from "@/lib/communication/catalog-types";
import {
  mapCommunicationLessonAccuracy,
  mapDueCommunicationReviews,
  type CommunicationReviewAccuracyRow,
} from "@/lib/communication/catalog-mapping";


function localDayStart() {
  const day = new Date();
  day.setHours(0, 0, 0, 0);
  return day.toISOString();
}

async function loadPublishedCatalog(supabase: SupabaseClient) {
  const [topicResult, lessonResult] = await Promise.all([
    supabase.from("communication_topics").select("id,slug,title_en,title_vi,description_en,description_vi,sort_order").eq("status", "published").order("sort_order"),
    supabase.from("communication_lessons").select("id,topic_id,title_en,title_vi,difficulty,sort_order,communication_topics!inner(status)").eq("status", "published").eq("communication_topics.status", "published").order("sort_order"),
  ]);
  if (topicResult.error) throw topicResult.error;
  if (lessonResult.error) throw lessonResult.error;

  return {
    topics: (topicResult.data ?? []) as Topic[],
    lessons: (lessonResult.data ?? []) as Lesson[],
  };
}

async function loadLearnerSnapshot(
  supabase: SupabaseClient,
  userId: string,
): Promise<Pick<SituationalEnglishCatalogSnapshot,
  "progress" | "lessonAccuracy" | "goal" | "dailyGoal" | "todayCompleted" | "dueItems"
>> {
  const data: Pick<SituationalEnglishCatalogSnapshot,
    "progress" | "lessonAccuracy" | "goal" | "dailyGoal" | "todayCompleted" | "dueItems"
  > = {
    progress: [],
    lessonAccuracy: {},
    goal: null,
    dailyGoal: 1,
    todayCompleted: 0,
    dueItems: [],
  };
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

  data.lessonAccuracy = mapCommunicationLessonAccuracy((accuracyResult.data ?? []) as CommunicationReviewAccuracyRow[]);
  if (!dueResult.data?.length) return data;

  const itemResult = await supabase.from("communication_lesson_items").select("id,lesson_id,content_en,meaning_vi").in("id", dueResult.data.map((review) => review.item_id));
  if (itemResult.error) throw itemResult.error;
  const lessonIds = [...new Set((itemResult.data ?? []).map((item) => item.lesson_id))];
  const dueLessons = lessonIds.length
    ? await supabase.from("communication_lessons").select("id,title_en,title_vi").in("id", lessonIds).eq("status", "published")
    : { data: [], error: null };
  if (dueLessons.error) throw dueLessons.error;
  data.dueItems = mapDueCommunicationReviews(itemResult.data ?? [], dueLessons.data ?? [], dueResult.data);
  return data;
}

export async function loadCommunicationCatalogSnapshot(
  supabase: SupabaseClient,
  userId: string | null,
): Promise<SituationalEnglishCatalogSnapshot> {
  const catalog = await loadPublishedCatalog(supabase);

  const data: SituationalEnglishCatalogSnapshot = {
    ...catalog,
    progress: [],
    lessonAccuracy: {},
    goal: null,
    dailyGoal: 1,
    todayCompleted: 0,
    dueItems: [],
    authenticated: Boolean(userId),
  };
  if (!userId) return data;
  return { ...data, ...await loadLearnerSnapshot(supabase, userId) };
}

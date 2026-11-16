import type { SupabaseClient } from "@/lib/supabase/client";
import type { CommunicationCsvRecord } from "@/lib/communication/csv";
import type { ContentStatus } from "@/lib/communication/content-types";

export async function ensureTopicAndLessonIds(
  supabase: SupabaseClient,
  records: CommunicationCsvRecord[],
): Promise<Map<string, string>> {
  const topicsBySlug = new Map<string, string>();
  const lessonsByKey = new Map<string, string>();
  const topicRows = [...new Map(records.map((row) => [row.topic_slug, {
    slug: row.topic_slug,
    title_en: row.topic_title_en,
    title_vi: row.topic_title_vi,
    description_en: row.topic_description_en,
    description_vi: row.topic_description_vi,
    sort_order: row.topic_order,
    status: "published" as ContentStatus,
  }])).values()];
  const result = await supabase.from("communication_topics")
    .select("slug").in("slug", topicRows.map((row) => row.slug));
  if (result.error) throw result.error;
  const existingTopicSlugs = new Set((result.data ?? []).map((row) => row.slug));
  const newTopicRows = topicRows.filter((row) => !existingTopicSlugs.has(row.slug));
  if (newTopicRows.length) {
    const insertTopics = await supabase.from("communication_topics").insert(newTopicRows);
    if (insertTopics.error) throw insertTopics.error;
  }

  const lookup = await supabase.from("communication_topics")
    .select("id,slug").in("slug", topicRows.map((row) => row.slug));
  if (lookup.error) throw lookup.error;
  for (const row of lookup.data ?? []) topicsBySlug.set(row.slug, row.id);

  const lessonRows = [...new Map(records.map((row) => [row.lesson_key, {
    lesson_key: row.lesson_key,
    topic_id: topicsBySlug.get(row.topic_slug),
    title_en: row.lesson_title_en,
    title_vi: row.lesson_title_vi,
    difficulty: row.difficulty,
    sort_order: row.lesson_order,
    status: row.lesson_status,
  }])).values()];
  if (lessonRows.some((row) => !row.topic_id)) {
    throw new Error("Import references a topic that could not be resolved.");
  }

  const existingLessonsResult = await supabase.from("communication_lessons")
    .select("lesson_key").in("lesson_key", lessonRows.map((row) => row.lesson_key));
  if (existingLessonsResult.error) throw existingLessonsResult.error;
  const existingLessonKeys = new Set((existingLessonsResult.data ?? []).map((row) => row.lesson_key));
  const newLessonRows = lessonRows.filter((row) => !existingLessonKeys.has(row.lesson_key));
  if (newLessonRows.length) {
    const insertLessons = await supabase.from("communication_lessons").insert(newLessonRows);
    if (insertLessons.error) throw insertLessons.error;
  }

  const lessonLookup = await supabase.from("communication_lessons")
    .select("id,lesson_key").in("lesson_key", lessonRows.map((row) => row.lesson_key));
  if (lessonLookup.error) throw lessonLookup.error;
  for (const row of lessonLookup.data ?? []) lessonsByKey.set(row.lesson_key, row.id);
  return lessonsByKey;
}

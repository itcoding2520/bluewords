import type { SupabaseClient } from "@/lib/supabase/client";
import { fetchAllPages } from "@/lib/supabase/fetch-all-pages.mjs";
import { buildCommunicationExportRecords, type ExportDialogue, type ExportTurn } from "@/lib/communication/export-records";
import type { CommunicationLesson, CommunicationLessonItem, CommunicationTopic } from "@/lib/supabase/communication-admin-types";

export async function loadCommunicationSituationExport(supabase: SupabaseClient, topicId: string) {
  const [topicResult, lessonResult] = await Promise.all([
    supabase.from("communication_topics").select("*").eq("id", topicId).single(),
    supabase.from("communication_lessons").select("*").eq("topic_id", topicId).order("sort_order").order("title_en"),
  ]);
  if (topicResult.error) throw topicResult.error;
  if (lessonResult.error) throw lessonResult.error;

  const topic = topicResult.data as CommunicationTopic;
  const lessons = (lessonResult.data ?? []) as CommunicationLesson[];
  const lessonIds = lessons.map((lesson) => lesson.id);
  let allItems: CommunicationLessonItem[] = [];
  let allDialogues: ExportDialogue[] = [];
  if (lessonIds.length) {
    [allItems, allDialogues] = await Promise.all([
      fetchAllPages<CommunicationLessonItem>(async (from, to) => {
        const { data, error } = await supabase.from("communication_lesson_items").select("*").in("lesson_id", lessonIds).order("sort_order").order("item_key").range(from, to);
        return { data: (data ?? []) as CommunicationLessonItem[], error };
      }),
      fetchAllPages<ExportDialogue>(async (from, to) => {
        const { data, error } = await supabase.from("communication_dialogues").select("*").in("lesson_id", lessonIds).order("dialogue_key").range(from, to);
        return { data: (data ?? []) as ExportDialogue[], error };
      }),
    ]);
  }
  const dialogueIds = allDialogues.map((dialogue) => dialogue.id);
  const allTurns = dialogueIds.length ? await fetchAllPages<ExportTurn>(async (from, to) => {
    const { data, error } = await supabase.from("communication_dialogue_turns").select("*").in("dialogue_id", dialogueIds).order("turn_key").range(from, to);
    return { data: (data ?? []) as ExportTurn[], error };
  }) : [];

  const records = buildCommunicationExportRecords(topic, lessons, allItems, allDialogues, allTurns);
  return { topicSlug: topic.slug, records };
}

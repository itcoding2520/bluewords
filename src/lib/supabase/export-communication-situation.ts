import type { createClient } from "@/lib/supabase/client";
import { fetchAllPages } from "@/lib/supabase/fetch-all-pages.mjs";
import type { CommunicationCsvRecord } from "@/lib/supabase/situational-english";
import type { CommunicationLesson, CommunicationLessonItem, CommunicationTopic } from "@/lib/supabase/communication-admin-types";

type SupabaseClient = ReturnType<typeof createClient>;
type ExportDialogue = { id: string; dialogue_key: string; lesson_id: string; title_en: string; title_vi: string; prompt_vi: string; sort_order: number };
type ExportTurn = { id: string; turn_key: string; dialogue_id: string; turn_order: number; speaker: string; text_en: string; meaning_vi: string; audio_url: string; response_prompt_vi: string; expected_response: string; response_options: string[] };

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

  const lessonMap = new Map(lessons.map((row) => [row.id, row]));
  const common = (lessonId: string) => {
    const lesson = lessonMap.get(lessonId);
    if (!lesson) return null;
    return { topic_slug: topic.slug, topic_title_en: topic.title_en, topic_title_vi: topic.title_vi, topic_description_en: topic.description_en, topic_description_vi: topic.description_vi, topic_order: topic.sort_order, lesson_key: lesson.lesson_key, lesson_title_en: lesson.title_en, lesson_title_vi: lesson.title_vi, difficulty: lesson.difficulty, lesson_order: lesson.sort_order, lesson_status: lesson.status };
  };
  const records: CommunicationCsvRecord[] = [];
  for (const item of allItems) {
    const details = common(item.lesson_id);
    if (!details) continue;
    records.push({ record_type: "item", ...details, record_key: item.item_key, record_order: item.sort_order, item_type: item.item_type, content_en: item.content_en, meaning_vi: item.meaning_vi, example_en: item.example_en, example_vi: item.example_vi, image_keyword: item.image_keyword, audio_url: item.audio_url, dialogue_key: "", dialogue_title_en: "", dialogue_title_vi: "", dialogue_prompt_vi: "", speaker: "", turn_order: null, turn_text_en: "", turn_meaning_vi: "", turn_audio_url: "", response_prompt_vi: "", expected_response: "", response_options: [] });
  }
  const dialogueMap = new Map(allDialogues.map((dialogue) => [dialogue.id, dialogue]));
  for (const turn of allTurns) {
    const dialogue = dialogueMap.get(turn.dialogue_id);
    const details = dialogue ? common(dialogue.lesson_id) : null;
    if (!dialogue || !details) continue;
    records.push({ record_type: "dialogue_turn", ...details, record_key: turn.turn_key, record_order: dialogue.sort_order, item_type: "", content_en: "", meaning_vi: "", example_en: "", example_vi: "", image_keyword: "", audio_url: "", dialogue_key: dialogue.dialogue_key, dialogue_title_en: dialogue.title_en, dialogue_title_vi: dialogue.title_vi, dialogue_prompt_vi: dialogue.prompt_vi, speaker: turn.speaker, turn_order: turn.turn_order, turn_text_en: turn.text_en, turn_meaning_vi: turn.meaning_vi, turn_audio_url: turn.audio_url, response_prompt_vi: turn.response_prompt_vi, expected_response: turn.expected_response, response_options: turn.response_options });
  }
  return { topicSlug: topic.slug, records };
}

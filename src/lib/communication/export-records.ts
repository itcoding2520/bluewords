import type { CommunicationCsvRecord } from "@/lib/communication/csv";
import type {
  CommunicationDialogue,
  CommunicationDialogueTurn,
  CommunicationLesson,
  CommunicationLessonItem,
  CommunicationTopic,
} from "@/lib/supabase/communication-admin-types";

export type ExportDialogue = CommunicationDialogue;
export type ExportTurn = CommunicationDialogueTurn;

type CommonLessonFields = Pick<CommunicationCsvRecord,
  | "topic_slug" | "topic_title_en" | "topic_title_vi" | "topic_description_en" | "topic_description_vi" | "topic_order"
  | "lesson_key" | "lesson_title_en" | "lesson_title_vi" | "difficulty" | "lesson_order" | "lesson_status"
>;

type ContentFields = Omit<
  CommunicationCsvRecord,
  keyof CommonLessonFields | "record_type" | "record_key" | "record_order"
>;

function getCommonLessonFields(
  topic: CommunicationTopic,
  lesson: CommunicationLesson,
): CommonLessonFields {
  return {
    topic_slug: topic.slug,
    topic_title_en: topic.title_en,
    topic_title_vi: topic.title_vi,
    topic_description_en: topic.description_en,
    topic_description_vi: topic.description_vi,
    topic_order: topic.sort_order,
    lesson_key: lesson.lesson_key,
    lesson_title_en: lesson.title_en,
    lesson_title_vi: lesson.title_vi,
    difficulty: lesson.difficulty,
    lesson_order: lesson.sort_order,
    lesson_status: lesson.status,
  };
}

function createEmptyContentFields(): ContentFields {
  return {
    item_type: "",
    content_en: "",
    meaning_vi: "",
    example_en: "",
    example_vi: "",
    image_keyword: "",
    audio_url: "",
    dialogue_key: "",
    dialogue_title_en: "",
    dialogue_title_vi: "",
    dialogue_prompt_vi: "",
    speaker: "",
    turn_order: null,
    turn_text_en: "",
    turn_meaning_vi: "",
    turn_audio_url: "",
    response_prompt_vi: "",
    expected_response: "",
    response_options: [],
  };
}

function createItemRecord(item: CommunicationLessonItem, common: CommonLessonFields): CommunicationCsvRecord {
  return {
    record_type: "item",
    ...common,
    record_key: item.item_key,
    record_order: item.sort_order,
    ...createEmptyContentFields(),
    item_type: item.item_type,
    content_en: item.content_en,
    meaning_vi: item.meaning_vi,
    example_en: item.example_en,
    example_vi: item.example_vi,
    image_keyword: item.image_keyword,
    audio_url: item.audio_url,
  };
}

function createDialogueTurnRecord(
  turn: ExportTurn,
  dialogue: ExportDialogue,
  common: CommonLessonFields,
): CommunicationCsvRecord {
  return {
    record_type: "dialogue_turn",
    ...common,
    record_key: turn.turn_key,
    record_order: dialogue.sort_order,
    ...createEmptyContentFields(),
    dialogue_key: dialogue.dialogue_key,
    dialogue_title_en: dialogue.title_en,
    dialogue_title_vi: dialogue.title_vi,
    dialogue_prompt_vi: dialogue.prompt_vi,
    speaker: turn.speaker,
    turn_order: turn.turn_order,
    turn_text_en: turn.text_en,
    turn_meaning_vi: turn.meaning_vi,
    turn_audio_url: turn.audio_url,
    response_prompt_vi: turn.response_prompt_vi,
    expected_response: turn.expected_response,
    response_options: turn.response_options,
  };
}

export function buildCommunicationExportRecords(
  topic: CommunicationTopic,
  lessons: CommunicationLesson[],
  items: CommunicationLessonItem[],
  dialogues: ExportDialogue[],
  turns: ExportTurn[],
): CommunicationCsvRecord[] {
  const commonFieldsByLessonId = new Map<string, CommonLessonFields>();
  for (const lesson of lessons) {
    commonFieldsByLessonId.set(lesson.id, getCommonLessonFields(topic, lesson));
  }
  const dialogueMap = new Map(dialogues.map((dialogue) => [dialogue.id, dialogue]));
  const records: CommunicationCsvRecord[] = [];

  for (const item of items) {
    const common = commonFieldsByLessonId.get(item.lesson_id);
    if (common) records.push(createItemRecord(item, common));
  }

  for (const turn of turns) {
    const dialogue = dialogueMap.get(turn.dialogue_id);
    if (!dialogue) continue;
    const common = commonFieldsByLessonId.get(dialogue.lesson_id);
    if (common) records.push(createDialogueTurnRecord(turn, dialogue, common));
  }

  return records;
}

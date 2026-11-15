import type { SupabaseClient } from "@/lib/supabase/client";
import { fetchAllPages } from "@/lib/supabase/fetch-all-pages.mjs";
import {
  parseCommunicationCsvDetailed,
  type CommunicationCsvRecord,
  type ContentStatus,
} from "@/lib/communication/csv";

export type CommunicationCsvImportResult = {
  importedItems: number;
  importedTurns: number;
  skippedRows: number;
  skippedRowNumbers: number[];
  duplicateRowsInFile: number[];
  hasContentRows: boolean;
};

type ResolvedLessons = {
  lessonsByKey: Map<string, string>;
};

type ImportedItems = {
  itemCount: number;
  existingItemKeys: Set<string>;
  skippedExistingRows: number;
};

type ImportedTurns = {
  turnCount: number;
  skippedTurnKeys: Set<string>;
};

export async function importCommunicationCsv(
  supabase: SupabaseClient,
  csv: string,
): Promise<CommunicationCsvImportResult> {
  const parsed = parseCommunicationCsvDetailed(csv);
  const records = parsed.records;
  if (!records.length) {
    return {
      importedItems: 0,
      importedTurns: 0,
      skippedRows: 0,
      skippedRowNumbers: [],
      duplicateRowsInFile: parsed.duplicates.map((duplicate) => duplicate.row),
      hasContentRows: false,
    };
  }

  const ids = await ensureTopicAndLessonIds(supabase, records);
  const items = await importNewItems(supabase, records, ids.lessonsByKey);
  const dialogueRecords = records.filter((row) => row.record_type === "dialogue_turn");
  const turns = await importNewDialogueTurns(supabase, dialogueRecords, ids.lessonsByKey);
  const skippedRowNumbers = [
    ...parsed.duplicates.map((duplicate) => duplicate.row),
    ...records.flatMap((row, index) =>
      (row.record_type === "item" && items.existingItemKeys.has(row.record_key))
      || (row.record_type === "dialogue_turn" && turns.skippedTurnKeys.has(row.record_key))
        ? [parsed.recordRows[index]] : []),
  ].sort((a, b) => a - b);

  return {
    importedItems: items.itemCount,
    importedTurns: turns.turnCount,
    skippedRows: parsed.duplicates.length + items.skippedExistingRows + turns.skippedTurnKeys.size,
    skippedRowNumbers,
    duplicateRowsInFile: parsed.duplicates.map((duplicate) => duplicate.row),
    hasContentRows: true,
  };
}

async function ensureTopicAndLessonIds(
  supabase: SupabaseClient,
  records: CommunicationCsvRecord[],
): Promise<ResolvedLessons> {
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
  return { lessonsByKey };
}

async function importNewItems(
  supabase: SupabaseClient,
  records: CommunicationCsvRecord[],
  lessonsByKey: Map<string, string>,
): Promise<ImportedItems> {
  const allItemRows = records.filter((row) => row.record_type === "item").map((row) => ({
    item_key: row.record_key,
    lesson_id: lessonsByKey.get(row.lesson_key),
    item_type: row.item_type,
    content_en: row.content_en,
    meaning_vi: row.meaning_vi,
    example_en: row.example_en,
    example_vi: row.example_vi,
    image_keyword: row.image_keyword,
    audio_url: row.audio_url,
    sort_order: row.record_order,
  }));
  const itemKeys = allItemRows.map((row) => row.item_key);
  const itemKeyBatches = Array.from(
    { length: Math.ceil(itemKeys.length / 100) },
    (_, index) => itemKeys.slice(index * 100, (index + 1) * 100),
  );
  const existingItemsByBatch = await Promise.all(itemKeyBatches.map((itemKeyBatch) =>
    fetchAllPages<{ item_key: string }>(async (from, to) => {
      const { data, error } = await supabase.from("communication_lesson_items")
        .select("item_key").in("item_key", itemKeyBatch)
        .order("item_key").range(from, to);
      return { data: data ?? [], error };
    })
  ));
  const existingItemKeys = new Set(existingItemsByBatch.flat().map((row) => row.item_key));
  const itemRows = allItemRows.filter((row) => !existingItemKeys.has(row.item_key));
  const skippedExistingRows = records.filter((row) =>
    row.record_type === "item" && existingItemKeys.has(row.record_key)
  ).length;
  if (itemRows.length) {
    const insertItems = await supabase.from("communication_lesson_items").insert(itemRows);
    if (insertItems.error) throw insertItems.error;
  }

  return { itemCount: itemRows.length, existingItemKeys, skippedExistingRows };
}

async function importNewDialogueTurns(
  supabase: SupabaseClient,
  dialogueRecords: CommunicationCsvRecord[],
  lessonsByKey: Map<string, string>,
): Promise<ImportedTurns> {
  const dialoguesByKey = new Map<string, string>();
  const skippedTurnKeys = new Set<string>();
  if (!dialogueRecords.length) return { turnCount: 0, skippedTurnKeys };

  const allDialogueRows = [...new Map(dialogueRecords.map((row) => [row.dialogue_key, {
    dialogue_key: row.dialogue_key,
    lesson_id: lessonsByKey.get(row.lesson_key),
    title_en: row.dialogue_title_en,
    title_vi: row.dialogue_title_vi,
    prompt_vi: row.dialogue_prompt_vi,
    sort_order: row.record_order,
  }])).values()];
  const dialogueKeys = allDialogueRows.map((row) => row.dialogue_key);
  const existingDialoguesResult = await supabase.from("communication_dialogues")
    .select("dialogue_key").in("dialogue_key", dialogueKeys);
  if (existingDialoguesResult.error) throw existingDialoguesResult.error;
  const existingDialogueKeys = new Set((existingDialoguesResult.data ?? []).map((row) => row.dialogue_key));
  const dialogueRows = allDialogueRows.filter((row) => !existingDialogueKeys.has(row.dialogue_key));
  if (dialogueRows.length) {
    const insertDialogues = await supabase.from("communication_dialogues").insert(dialogueRows);
    if (insertDialogues.error) throw insertDialogues.error;
  }

  const dialogueLookup = await supabase.from("communication_dialogues")
    .select("id,dialogue_key").in("dialogue_key", dialogueKeys);
  if (dialogueLookup.error) throw dialogueLookup.error;
  for (const row of dialogueLookup.data ?? []) dialoguesByKey.set(row.dialogue_key, row.id);
  const allTurnRows = dialogueRecords.map((row) => ({
    turn_key: row.record_key,
    dialogue_id: dialoguesByKey.get(row.dialogue_key),
    turn_order: row.turn_order,
    speaker: row.speaker,
    text_en: row.turn_text_en,
    meaning_vi: row.turn_meaning_vi,
    audio_url: row.turn_audio_url,
    response_prompt_vi: row.response_prompt_vi,
    expected_response: row.expected_response,
    response_options: row.response_options,
  }));
  const dialogueIds = [...new Set(dialogueRecords
    .map((row) => dialoguesByKey.get(row.dialogue_key))
    .filter((id): id is string => Boolean(id)))];
  const existingTurns = dialogueIds.length
    ? await fetchAllPages<{ turn_key: string; dialogue_id: string; turn_order: number }>(async (from, to) => {
      const { data, error } = await supabase.from("communication_dialogue_turns")
        .select("turn_key,dialogue_id,turn_order").in("dialogue_id", dialogueIds)
        .order("dialogue_id").order("turn_order").range(from, to);
      return { data: data ?? [], error };
    })
    : [];
  const existingTurnKeys = new Set(existingTurns.map((row) => row.turn_key));
  const existingTurnOrders = new Set(existingTurns.map((row) => `${row.dialogue_id}:${row.turn_order}`));
  for (const row of dialogueRecords) {
    const dialogueId = dialoguesByKey.get(row.dialogue_key);
    if (existingTurnKeys.has(row.record_key)
      || (dialogueId && existingTurnOrders.has(`${dialogueId}:${row.turn_order}`))) {
      skippedTurnKeys.add(row.record_key);
    }
  }

  const turnRows = allTurnRows.filter((row) => !skippedTurnKeys.has(row.turn_key));
  if (turnRows.length) {
    const insertTurns = await supabase.from("communication_dialogue_turns").insert(turnRows);
    if (insertTurns.error) throw insertTurns.error;
  }
  return { turnCount: turnRows.length, skippedTurnKeys };
}

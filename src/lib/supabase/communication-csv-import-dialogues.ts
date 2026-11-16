import type { SupabaseClient } from "@/lib/supabase/client";
import { type CommunicationCsvRecord } from "@/lib/communication/csv";
import { fetchAllPages } from "@/lib/supabase/fetch-all-pages.mjs";

export async function importNewCommunicationTurns(
  supabase: SupabaseClient,
  dialogueRecords: CommunicationCsvRecord[],
  lessonsByKey: Map<string, string>,
) {
  const skippedTurnKeys = new Set<string>();
  if (!dialogueRecords.length) return { turnCount: 0, skippedTurnKeys };

  const dialoguesByKey = new Map<string, string>();
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

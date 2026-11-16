import { validateCommunicationCsvRecord } from "@/lib/communication/csv-record-validation";
import type {
  CommunicationCsvRecord,
} from "@/lib/communication/csv";
import { isContentStatus } from "@/lib/communication/content-types";
import { isLessonItemType } from "@/lib/communication/lesson-types";
import { isDifficultyLevel } from "@/types/difficulty";

function integer(value: string, fallback: number, row: number, label: string) {
  if (!value.trim()) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`Row ${row}: ${label} must be a non-negative whole number.`);
  }
  return parsed;
}

function parseResponseOptions(value: string, row: number): string[] {
  let options: unknown = [];
  if (value) {
    try {
      options = JSON.parse(value);
    } catch {
      throw new Error(`Row ${row}: response_options_json must contain a valid JSON array.`);
    }
  }
  if (!Array.isArray(options) || !options.every((option): option is string => typeof option === "string")) {
    throw new Error(`Row ${row}: response_options_json must be an array of strings.`);
  }

  const normalizedOptions = options.map((option) => option.trim());
  if (normalizedOptions.some((option) => !option)) {
    throw new Error(`Row ${row}: response_options_json cannot contain empty choices.`);
  }
  if (new Set(normalizedOptions.map((option) => option.toLocaleLowerCase())).size !== normalizedOptions.length) {
    throw new Error(`Row ${row}: response_options_json cannot contain duplicate choices.`);
  }
  return normalizedOptions;
}

export function parseCommunicationCsvRecord(
  cells: string[],
  columnNames: string[],
  line: number
): CommunicationCsvRecord {
  const get = (name: string) => (cells[columnNames.indexOf(name)] ?? "").trim();
  const recordType = get("record_type").toLowerCase();
  if (recordType !== "item" && recordType !== "dialogue_turn") {
    throw new Error(`Row ${line}: record_type must be item or dialogue_turn.`);
  }
  const difficulty = get("difficulty").toLowerCase();
  if (!isDifficultyLevel(difficulty)) {
    throw new Error(`Row ${line}: difficulty must be easy, medium, or hard.`);
  }
  const status = get("lesson_status").toLowerCase();
  if (!isContentStatus(status)) {
    throw new Error(`Row ${line}: lesson_status must be draft, published, or archived.`);
  }

  const normalizedOptions = parseResponseOptions(get("response_options_json"), line);

  const itemType = get("item_type");
  if (recordType === "item" && !isLessonItemType(itemType)) {
    throw new Error(`Row ${line}: item_type must be word, phrase, or sentence_pattern.`);
  }

  const record: CommunicationCsvRecord = {
    record_type: recordType,
    topic_slug: get("topic_slug"), topic_title_en: get("topic_title_en"), topic_title_vi: get("topic_title_vi"),
    topic_description_en: get("topic_description_en"), topic_description_vi: get("topic_description_vi"),
    topic_order: integer(get("topic_order"), 0, line, "topic_order"), lesson_key: get("lesson_key"),
    lesson_title_en: get("lesson_title_en"), lesson_title_vi: get("lesson_title_vi"), difficulty,
    lesson_order: integer(get("lesson_order"), 0, line, "lesson_order"), lesson_status: status,
    record_key: get("record_key"), record_order: integer(get("record_order"), 0, line, "record_order"),
    item_type: itemType as CommunicationCsvRecord["item_type"], content_en: get("content_en"), meaning_vi: get("meaning_vi"),
    example_en: get("example_en"), example_vi: get("example_vi"), image_keyword: get("image_keyword"), audio_url: get("audio_url"),
    dialogue_key: get("dialogue_key"), dialogue_title_en: get("dialogue_title_en"), dialogue_title_vi: get("dialogue_title_vi"),
    dialogue_prompt_vi: get("dialogue_prompt_vi"), speaker: get("speaker"), turn_order: get("turn_order") ? integer(get("turn_order"), 1, line, "turn_order") : null,
    turn_text_en: get("turn_text_en"), turn_meaning_vi: get("turn_meaning_vi"), turn_audio_url: get("turn_audio_url"),
    response_prompt_vi: get("response_prompt_vi"), expected_response: get("expected_response"), response_options: normalizedOptions,
  };

  validateCommunicationCsvRecord(record, line);

  return record;
}

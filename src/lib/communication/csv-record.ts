import { isOptionalHttpUrl } from "@/lib/communication/url-validation";
import type {
  CommunicationCsvRecord,
  CommunicationDifficulty,
  ContentStatus,
} from "@/lib/communication/csv";

function integer(value: string, fallback: number, row: number, label: string) {
  if (!value.trim()) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`Row ${row}: ${label} must be a non-negative whole number.`);
  }
  return parsed;
}

function validateAudioUrl(value: string, row: number, label: string) {
  if (!isOptionalHttpUrl(value)) {
    throw new Error(`Row ${row}: ${label} must be a valid HTTP or HTTPS URL.`);
  }
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
  if (!Array.isArray(options) || options.some((option) => typeof option !== "string")) {
    throw new Error(`Row ${row}: response_options_json must be an array of strings.`);
  }

  const normalizedOptions = (options as string[]).map((option) => option.trim());
  if (normalizedOptions.some((option) => !option)) {
    throw new Error(`Row ${row}: response_options_json cannot contain empty choices.`);
  }
  if (new Set(normalizedOptions.map((option) => option.toLocaleLowerCase())).size !== normalizedOptions.length) {
    throw new Error(`Row ${row}: response_options_json cannot contain duplicate choices.`);
  }
  return normalizedOptions;
}

function validateCommonFields(record: CommunicationCsvRecord, row: number) {
  const commonRequired: Array<keyof CommunicationCsvRecord> = [
    "topic_slug", "topic_title_en", "topic_title_vi", "lesson_key", "lesson_title_en", "lesson_title_vi", "record_key",
  ];
  const missingCommon = commonRequired.filter((key) => !String(record[key] ?? "").trim());
  if (missingCommon.length) {
    throw new Error(`Row ${row}: required fields missing: ${missingCommon.join(", ")}.`);
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.topic_slug)) {
    throw new Error(`Row ${row}: topic_slug must use lowercase letters, numbers, and hyphens.`);
  }
  if (record.lesson_key.length < 2 || record.lesson_key.length > 80) {
    throw new Error(`Row ${row}: lesson_key must be between 2 and 80 characters.`);
  }
  if (record.record_key.length < 2 || record.record_key.length > (record.record_type === "item" ? 100 : 120)) {
    throw new Error(`Row ${row}: record_key is outside the database length limit.`);
  }
  validateAudioUrl(record.audio_url, row, "audio_url");
  validateAudioUrl(record.turn_audio_url, row, "turn_audio_url");
}

function validateItemFields(record: CommunicationCsvRecord, row: number) {
  if (!record.content_en || !record.meaning_vi) {
    throw new Error(`Row ${row}: item rows need content_en and meaning_vi.`);
  }
  if (Boolean(record.example_en) !== Boolean(record.example_vi)) {
    throw new Error(`Row ${row}: provide both example_en and example_vi, or leave both blank.`);
  }
  if (record.item_type === "sentence_pattern" && (!record.example_en || !record.example_vi)) {
    throw new Error(`Row ${row}: sentence_pattern rows need a complete English and Vietnamese example.`);
  }
}

function validateDialogueFields(record: CommunicationCsvRecord, row: number) {
  if (!record.dialogue_key || !record.dialogue_title_en || !record.speaker || !record.turn_order || !record.turn_text_en) {
    throw new Error(`Row ${row}: dialogue rows need dialogue key/title, speaker, turn_order, and turn_text_en.`);
  }
  if (record.dialogue_key.length < 2 || record.dialogue_key.length > 100) {
    throw new Error(`Row ${row}: dialogue_key must be between 2 and 100 characters.`);
  }
  if (record.response_options.length > 0 && (record.response_options.length < 2 || !record.expected_response)) {
    throw new Error(`Row ${row}: response choices need at least two options and an expected_response.`);
  }
  if (record.expected_response && !record.response_options.includes(record.expected_response)) {
    throw new Error(`Row ${row}: expected_response must match one of response_options_json.`);
  }
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
  if (!["easy", "medium", "hard"].includes(difficulty)) {
    throw new Error(`Row ${line}: difficulty must be easy, medium, or hard.`);
  }
  const status = get("lesson_status").toLowerCase();
  if (!["draft", "published", "archived"].includes(status)) {
    throw new Error(`Row ${line}: lesson_status must be draft, published, or archived.`);
  }

  const normalizedOptions = parseResponseOptions(get("response_options_json"), line);

  const itemType = get("item_type");
  if (recordType === "item" && !["word", "phrase", "sentence_pattern"].includes(itemType)) {
    throw new Error(`Row ${line}: item_type must be word, phrase, or sentence_pattern.`);
  }

  const record: CommunicationCsvRecord = {
    record_type: recordType,
    topic_slug: get("topic_slug"), topic_title_en: get("topic_title_en"), topic_title_vi: get("topic_title_vi"),
    topic_description_en: get("topic_description_en"), topic_description_vi: get("topic_description_vi"),
    topic_order: integer(get("topic_order"), 0, line, "topic_order"), lesson_key: get("lesson_key"),
    lesson_title_en: get("lesson_title_en"), lesson_title_vi: get("lesson_title_vi"), difficulty: difficulty as CommunicationDifficulty,
    lesson_order: integer(get("lesson_order"), 0, line, "lesson_order"), lesson_status: status as ContentStatus,
    record_key: get("record_key"), record_order: integer(get("record_order"), 0, line, "record_order"),
    item_type: itemType as CommunicationCsvRecord["item_type"], content_en: get("content_en"), meaning_vi: get("meaning_vi"),
    example_en: get("example_en"), example_vi: get("example_vi"), image_keyword: get("image_keyword"), audio_url: get("audio_url"),
    dialogue_key: get("dialogue_key"), dialogue_title_en: get("dialogue_title_en"), dialogue_title_vi: get("dialogue_title_vi"),
    dialogue_prompt_vi: get("dialogue_prompt_vi"), speaker: get("speaker"), turn_order: get("turn_order") ? integer(get("turn_order"), 1, line, "turn_order") : null,
    turn_text_en: get("turn_text_en"), turn_meaning_vi: get("turn_meaning_vi"), turn_audio_url: get("turn_audio_url"),
    response_prompt_vi: get("response_prompt_vi"), expected_response: get("expected_response"), response_options: normalizedOptions,
  };

  validateCommonFields(record, line);
  if (record.record_type === "item") validateItemFields(record, line);
  else validateDialogueFields(record, line);

  return record;
}

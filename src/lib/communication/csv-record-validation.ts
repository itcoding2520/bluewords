import { isOptionalHttpUrl } from "@/lib/communication/url-validation";
import type { CommunicationCsvRecord } from "@/lib/communication/csv";

function validateAudioUrl(value: string, row: number, label: string) {
  if (!isOptionalHttpUrl(value)) {
    throw new Error(`Row ${row}: ${label} must be a valid HTTP or HTTPS URL.`);
  }
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

export function validateCommunicationCsvRecord(record: CommunicationCsvRecord, row: number): void {
  validateCommonFields(record, row);
  if (record.record_type === "item") validateItemFields(record, row);
  else validateDialogueFields(record, row);
}

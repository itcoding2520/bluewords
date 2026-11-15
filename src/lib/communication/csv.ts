import { parseCsvRows } from "@/lib/csv-rows";
import { validateCommunicationCsvConsistency } from "@/lib/communication/csv-consistency";
import { parseCommunicationCsvRecord } from "@/lib/communication/csv-record";

export type CommunicationDifficulty = "easy" | "medium" | "hard";
export type ContentStatus = "draft" | "published" | "archived";
export type CommunicationRecordType = "item" | "dialogue_turn";

export type CommunicationCsvRecord = {
  record_type: CommunicationRecordType;
  topic_slug: string;
  topic_title_en: string;
  topic_title_vi: string;
  topic_description_en: string;
  topic_description_vi: string;
  topic_order: number;
  lesson_key: string;
  lesson_title_en: string;
  lesson_title_vi: string;
  difficulty: CommunicationDifficulty;
  lesson_order: number;
  lesson_status: ContentStatus;
  record_key: string;
  record_order: number;
  item_type: "word" | "phrase" | "sentence_pattern" | "";
  content_en: string;
  meaning_vi: string;
  example_en: string;
  example_vi: string;
  image_keyword: string;
  audio_url: string;
  dialogue_key: string;
  dialogue_title_en: string;
  dialogue_title_vi: string;
  dialogue_prompt_vi: string;
  speaker: string;
  turn_order: number | null;
  turn_text_en: string;
  turn_meaning_vi: string;
  turn_audio_url: string;
  response_prompt_vi: string;
  expected_response: string;
  response_options: string[];
};

const headers = [
  "record_type", "topic_slug", "topic_title_en", "topic_title_vi", "topic_description_en", "topic_description_vi", "topic_order",
  "lesson_key", "lesson_title_en", "lesson_title_vi", "difficulty", "lesson_order", "lesson_status", "record_key", "record_order",
  "item_type", "content_en", "meaning_vi", "example_en", "example_vi", "image_keyword", "audio_url", "dialogue_key",
  "dialogue_title_en", "dialogue_title_vi", "dialogue_prompt_vi", "speaker", "turn_order", "turn_text_en", "turn_meaning_vi",
  "turn_audio_url", "response_prompt_vi", "expected_response", "response_options_json",
];


export type CommunicationCsvDuplicate = { row: number; recordType: CommunicationRecordType; recordKey: string };
export type ParsedCommunicationCsv = { records: CommunicationCsvRecord[]; recordRows: number[]; duplicates: CommunicationCsvDuplicate[] };

export function parseCommunicationCsvDetailed(csv: string): ParsedCommunicationCsv {
  const rows = parseCsvRows(csv, {
    unclosedQuote: "CSV has an unclosed quoted field.",
    missingContent: "CSV needs a header and at least one content row.",
  });
  const columnNames = rows[0].map((value) => value.trim().replace(/^\uFEFF/, ""));
  const missing = headers.filter((name) => !columnNames.includes(name));
  if (missing.length) throw new Error(`Missing CSV columns: ${missing.join(", ")}. Export a template from this page to get the expected columns.`);
  const mapped = rows.slice(1).map((cells, index) =>
    parseCommunicationCsvRecord(cells, columnNames, index + 2)
  );

  return validateCommunicationCsvConsistency(mapped);
}

export function parseCommunicationCsv(csv: string): CommunicationCsvRecord[] {
  return parseCommunicationCsvDetailed(csv).records;
}

function csvCell(value: string | number | null | undefined) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export function exportCommunicationCsv(records: CommunicationCsvRecord[]) {
  const outputHeaders = [...headers.slice(0, -1), "response_options_json"];
  const lines = records.map((record) => outputHeaders.map((name) => {
    if (name === "response_options_json") return csvCell(JSON.stringify(record.response_options));
    return csvCell(record[name as keyof CommunicationCsvRecord] as string | number | null | undefined);
  }).join(","));
  return [outputHeaders.map(csvCell).join(","), ...lines].join("\r\n");
}

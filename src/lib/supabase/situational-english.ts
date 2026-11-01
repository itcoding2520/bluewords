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

function parseCsvRows(csv: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i];
    if (quoted) {
      if (char === '"' && csv[i + 1] === '"') { field += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"' && field.length === 0) quoted = true;
    else if (char === ",") { row.push(field); field = ""; }
    else if (char === "\n" || char === "\r") {
      if (char === "\r" && csv[i + 1] === "\n") i += 1;
      row.push(field); field = "";
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
    } else field += char;
  }
  if (quoted) throw new Error("CSV has an unclosed quoted field.");
  if (field || row.length) { row.push(field); if (row.some((cell) => cell.trim())) rows.push(row); }
  if (rows.length < 2) throw new Error("CSV needs a header and at least one content row.");
  return rows;
}

const integer = (value: string, fallback: number, row: number, label: string) => {
  if (!value.trim()) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) throw new Error(`Row ${row}: ${label} must be a non-negative whole number.`);
  return parsed;
};

function validateAudioUrl(value: string, row: number, label: string) {
  if (!value) return;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error();
  } catch {
    throw new Error(`Row ${row}: ${label} must be a valid HTTP or HTTPS URL.`);
  }
}

export type CommunicationCsvDuplicate = { row: number; recordType: CommunicationRecordType; recordKey: string };
export type ParsedCommunicationCsv = { records: CommunicationCsvRecord[]; recordRows: number[]; duplicates: CommunicationCsvDuplicate[] };

export function parseCommunicationCsvDetailed(csv: string): ParsedCommunicationCsv {
  const rows = parseCsvRows(csv);
  const columnNames = rows[0].map((value) => value.trim().replace(/^\uFEFF/, ""));
  const missing = headers.filter((name) => !columnNames.includes(name));
  if (missing.length) throw new Error(`Missing CSV columns: ${missing.join(", ")}. Export a template from this page to get the expected columns.`);
  const mapped = rows.slice(1).map((cells, index): CommunicationCsvRecord => {
    const line = index + 2;
    const get = (name: string) => (cells[columnNames.indexOf(name)] ?? "").trim();
    const recordType = get("record_type").toLowerCase();
    if (recordType !== "item" && recordType !== "dialogue_turn") throw new Error(`Row ${line}: record_type must be item or dialogue_turn.`);
    const difficulty = get("difficulty").toLowerCase();
    if (!["easy", "medium", "hard"].includes(difficulty)) throw new Error(`Row ${line}: difficulty must be easy, medium, or hard.`);
    const status = get("lesson_status").toLowerCase();
    if (!["draft", "published", "archived"].includes(status)) throw new Error(`Row ${line}: lesson_status must be draft, published, or archived.`);
    let responseOptions: unknown = [];
    if (get("response_options_json")) {
      try { responseOptions = JSON.parse(get("response_options_json")); }
      catch { throw new Error(`Row ${line}: response_options_json must contain a valid JSON array.`); }
    }
    if (!Array.isArray(responseOptions) || responseOptions.some((option) => typeof option !== "string")) throw new Error(`Row ${line}: response_options_json must be an array of strings.`);
    const normalizedOptions = (responseOptions as string[]).map((option) => option.trim());
    if (normalizedOptions.some((option) => !option)) throw new Error(`Row ${line}: response_options_json cannot contain empty choices.`);
    if (new Set(normalizedOptions.map((option) => option.toLocaleLowerCase())).size !== normalizedOptions.length) throw new Error(`Row ${line}: response_options_json cannot contain duplicate choices.`);
    const itemType = get("item_type");
    if (recordType === "item" && !["word", "phrase", "sentence_pattern"].includes(itemType)) throw new Error(`Row ${line}: item_type must be word, phrase, or sentence_pattern.`);
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
    const commonRequired: Array<keyof CommunicationCsvRecord> = ["topic_slug", "topic_title_en", "topic_title_vi", "lesson_key", "lesson_title_en", "lesson_title_vi", "record_key"];
    const missingCommon = commonRequired.filter((key) => !String(record[key] ?? "").trim());
    if (missingCommon.length) throw new Error(`Row ${line}: required fields missing: ${missingCommon.join(", ")}.`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.topic_slug)) throw new Error(`Row ${line}: topic_slug must use lowercase letters, numbers, and hyphens.`);
    if (record.lesson_key.length < 2 || record.lesson_key.length > 80) throw new Error(`Row ${line}: lesson_key must be between 2 and 80 characters.`);
    if (record.record_key.length < 2 || record.record_key.length > (record.record_type === "item" ? 100 : 120)) throw new Error(`Row ${line}: record_key is outside the database length limit.`);
    validateAudioUrl(record.audio_url, line, "audio_url");
    validateAudioUrl(record.turn_audio_url, line, "turn_audio_url");
    if (record.record_type === "item") {
      if (!record.content_en || !record.meaning_vi) throw new Error(`Row ${line}: item rows need content_en and meaning_vi.`);
      if (Boolean(record.example_en) !== Boolean(record.example_vi)) throw new Error(`Row ${line}: provide both example_en and example_vi, or leave both blank.`);
      if (record.item_type === "sentence_pattern" && (!record.example_en || !record.example_vi)) throw new Error(`Row ${line}: sentence_pattern rows need a complete English and Vietnamese example.`);
    }
    if (record.record_type === "dialogue_turn") {
      if (!record.dialogue_key || !record.dialogue_title_en || !record.speaker || !record.turn_order || !record.turn_text_en) throw new Error(`Row ${line}: dialogue rows need dialogue key/title, speaker, turn_order, and turn_text_en.`);
      if (record.dialogue_key.length < 2 || record.dialogue_key.length > 100) throw new Error(`Row ${line}: dialogue_key must be between 2 and 100 characters.`);
      if (record.response_options.length > 0 && (record.response_options.length < 2 || !record.expected_response)) throw new Error(`Row ${line}: response choices need at least two options and an expected_response.`);
      if (record.expected_response && !record.response_options.includes(record.expected_response)) throw new Error(`Row ${line}: expected_response must match one of response_options_json.`);
    }
    return record;
  });

  const uniqueKeys = new Map<string, number>();
  const turnOrders = new Map<string, number>();
  const duplicates: CommunicationCsvDuplicate[] = [];
  const uniqueLines: number[] = [];
  const uniqueRecords = mapped.filter((item, index) => {
    const line = index + 2;
    const identity = `${item.record_type}:${item.record_key}`;
    const turnOrderKey = item.record_type === "dialogue_turn" ? `${item.dialogue_key}:${item.turn_order}` : null;
    if (uniqueKeys.has(identity) || (turnOrderKey && turnOrders.has(turnOrderKey))) {
      duplicates.push({ row: line, recordType: item.record_type, recordKey: item.record_key });
      return false;
    }
    uniqueKeys.set(identity, line);
    if (turnOrderKey) turnOrders.set(turnOrderKey, line);
    uniqueLines.push(line);
    return true;
  });
  const topicMetadata = new Map<string, string>();
  const lessonMetadata = new Map<string, string>();
  const dialogueMetadata = new Map<string, string>();
  uniqueRecords.forEach((item, index) => {
    const line = uniqueLines[index];
    const topic = JSON.stringify([item.topic_title_en, item.topic_title_vi, item.topic_description_en, item.topic_description_vi, item.topic_order]);
    if (topicMetadata.has(item.topic_slug) && topicMetadata.get(item.topic_slug) !== topic) throw new Error(`Row ${line}: topic fields differ from earlier rows for ${item.topic_slug}.`);
    topicMetadata.set(item.topic_slug, topic);
    const lesson = JSON.stringify([item.topic_slug, item.lesson_title_en, item.lesson_title_vi, item.difficulty, item.lesson_order, item.lesson_status]);
    if (lessonMetadata.has(item.lesson_key) && lessonMetadata.get(item.lesson_key) !== lesson) throw new Error(`Row ${line}: lesson fields differ from earlier rows for ${item.lesson_key}.`);
    lessonMetadata.set(item.lesson_key, lesson);
    if (item.record_type === "dialogue_turn") {
      const dialogue = JSON.stringify([item.lesson_key, item.dialogue_title_en, item.dialogue_title_vi, item.dialogue_prompt_vi]);
      if (dialogueMetadata.has(item.dialogue_key) && dialogueMetadata.get(item.dialogue_key) !== dialogue) throw new Error(`Row ${line}: dialogue fields differ from earlier rows for ${item.dialogue_key}.`);
      dialogueMetadata.set(item.dialogue_key, dialogue);
    }
  });
  return { records: uniqueRecords, recordRows: uniqueLines, duplicates };
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

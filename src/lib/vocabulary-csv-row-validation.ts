import {
  PARTS_OF_SPEECH,
  type PartOfSpeech,
} from "@/config/vocabulary";
import { restoreSpreadsheetCell } from "@/lib/spreadsheet-csv-safety.mjs";
import type { CsvRecord } from "@/lib/vocabulary-csv-parser";
import { VOCABULARY_CSV_HEADERS } from "@/lib/vocabulary-csv-shared";
import { normalizeVocabularyKey } from "@/lib/vocabulary/normalize-text";

export interface VocabularyCsvRowValues {
  word: string;
  typeValue: string;
  meaning: string;
  category: string;
  statusValue: string;
  partOfSpeechValue: string;
  detailedMeaning: string;
  partOfSpeech: PartOfSpeech | undefined;
  ipa: string | null;
}

export function readVocabularyCsvRow(
  record: CsvRecord,
  headerLength: number,
  columnIndex: Map<string, number>
): { values: VocabularyCsvRowValues | null; errors: string[] } {
  if (record.fields.length !== headerLength) {
    return {
      values: null,
      errors: [`Expected ${headerLength} columns, found ${record.fields.length}.`],
    };
  }

  const value = (name: (typeof VOCABULARY_CSV_HEADERS)[number]) =>
    restoreSpreadsheetCell(record.fields[columnIndex.get(name)!] ?? "").trim();
  const word = value("word");
  const typeValue = normalizeVocabularyKey(value("type"));
  const partOfSpeechValue = normalizeVocabularyKey(value("part_of_speech"));
  const partOfSpeech = PARTS_OF_SPEECH.find(
    (option) => normalizeVocabularyKey(option) === partOfSpeechValue
  );
  const meaning = value("meaning");
  // Older CSVs used `meaning` for the part-of-speech meaning. Continue to
  // accept them when the new, explicit `detailed_meaning` column is absent.
  const detailedMeaning = columnIndex.has("detailed_meaning")
    ? value("detailed_meaning")
    : partOfSpeechValue
      ? meaning
      : "";
  const category = value("category");
  const statusValue = normalizeVocabularyKey(value("status"));
  const ipa = columnIndex.has("ipa") ? value("ipa") || null : null;

  const errors: string[] = [];
  if (!word) errors.push("Word is required.");
  return {
    values: {
      word,
      typeValue,
      meaning,
      category,
      statusValue,
      partOfSpeechValue,
      detailedMeaning,
      partOfSpeech,
      ipa,
    },
    errors,
  };
}

export function validateVocabularyCsvRow(values: VocabularyCsvRowValues): string[] {
  const { typeValue, meaning, statusValue, detailedMeaning, partOfSpeech, partOfSpeechValue } = values;
  const errors: string[] = [];
  if (typeValue !== "word" && typeValue !== "expression") {
    errors.push('Type must be "word" or "expression".');
  }
  if (!meaning) errors.push("Meaning is required.");
  if (statusValue !== "learning" && statusValue !== "mastered") {
    errors.push('Status must be "learning" or "mastered".');
  }

  if (partOfSpeechValue && !partOfSpeech) {
    errors.push(`Part of speech must be one of: ${PARTS_OF_SPEECH.join(", ")}.`);
  }
  if (typeValue === "expression" && partOfSpeechValue) {
    errors.push("Expressions must leave part_of_speech blank.");
  }
  if (detailedMeaning && !partOfSpeech) {
    errors.push("Detailed meaning requires a valid part_of_speech.");
  }
  if (partOfSpeech && !detailedMeaning) {
    errors.push("Detailed meaning is required when part_of_speech is provided.");
  }

  return errors;
}

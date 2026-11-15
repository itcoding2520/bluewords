import {
  PARTS_OF_SPEECH,
  type PartOfSpeech,
  type VocabularyType,
} from "@/config/vocabulary";
import type { VocabularyWord } from "@/data/vocabulary";
import { restoreSpreadsheetCell } from "@/lib/spreadsheet-csv-safety.mjs";
import type { CsvRecord } from "@/lib/vocabulary-csv-parser";
import {
  VOCABULARY_CSV_HEADERS,
  type VocabularyCsvIssue,
} from "@/lib/vocabulary-csv-shared";

export interface VocabularyCsvWordGroup {
  word: string;
  type: VocabularyType;
  meaning: string;
  category: string;
  status: VocabularyWord["status"];
  detailedMeanings: Array<{ partOfSpeech: PartOfSpeech; meaning: string }>;
  seenMeanings: Set<string>;
  ipa: string | null;
}

function normalized(value: string): string {
  return value.trim().toLowerCase();
}

export function processVocabularyCsvRow({
  record,
  headerLength,
  columnIndex,
  categoriesByName,
  existing,
  groups,
  invalidGroups,
  duplicateWords,
  fallbackWords,
  errors,
}: {
  record: CsvRecord;
  headerLength: number;
  columnIndex: Map<string, number>;
  categoriesByName: Map<string, string>;
  existing: Set<string>;
  groups: Map<string, VocabularyCsvWordGroup>;
  invalidGroups: Set<string>;
  duplicateWords: Set<string>;
  fallbackWords: Set<string>;
  errors: VocabularyCsvIssue[];
}) {
  if (record.fields.length !== headerLength) {
    errors.push({
      line: record.line,
      message: `Expected ${headerLength} columns, found ${record.fields.length}.`,
    });
    return;
  }

  const value = (name: (typeof VOCABULARY_CSV_HEADERS)[number]) =>
    restoreSpreadsheetCell(record.fields[columnIndex.get(name)!] ?? "").trim();
  const word = value("word");
  const typeValue = normalized(value("type"));
  const partOfSpeechValue = normalized(value("part_of_speech"));
  const meaning = value("meaning");
  // Older CSVs used `meaning` for the part-of-speech meaning. Continue to
  // accept them when the new, explicit `detailed_meaning` column is absent.
  const detailedMeaning = columnIndex.has("detailed_meaning")
    ? value("detailed_meaning")
    : partOfSpeechValue
      ? meaning
      : "";
  const rawCategory = value("category");
  const statusValue = normalized(value("status"));
  const ipa = columnIndex.has("ipa") ? value("ipa") || null : null;
  const key = normalized(word);

  if (!word) {
    errors.push({ line: record.line, message: "Word is required." });
    return;
  }

  if (existing.has(key)) {
    duplicateWords.add(key);
    return;
  }

  const rowErrors: string[] = [];
  if (typeValue !== "word" && typeValue !== "expression") {
    rowErrors.push('Type must be "word" or "expression".');
  }
  if (!meaning) rowErrors.push("Meaning is required.");
  if (statusValue !== "learning" && statusValue !== "mastered") {
    rowErrors.push('Status must be "learning" or "mastered".');
  }

  const partOfSpeech = PARTS_OF_SPEECH.find(
    (option) => normalized(option) === partOfSpeechValue
  );
  if (partOfSpeechValue && !partOfSpeech) {
    rowErrors.push(
      `Part of speech must be one of: ${PARTS_OF_SPEECH.join(", ")}.`
    );
  }
  if (typeValue === "expression" && partOfSpeechValue) {
    rowErrors.push("Expressions must leave part_of_speech blank.");
  }
  if (detailedMeaning && !partOfSpeech) {
    rowErrors.push("Detailed meaning requires a valid part_of_speech.");
  }
  if (partOfSpeech && !detailedMeaning) {
    rowErrors.push("Detailed meaning is required when part_of_speech is provided.");
  }

  const category = categoriesByName.get(normalized(rawCategory));
  if (!category) fallbackWords.add(key);

  if (rowErrors.length) {
    rowErrors.forEach((message) => errors.push({ line: record.line, message }));
    invalidGroups.add(key);
    return;
  }

  const type = typeValue as VocabularyType;
  const status = statusValue as VocabularyWord["status"];
  const resolvedCategory = category ?? "Uncategorized";
  const existingGroup = groups.get(key);

  if (existingGroup) {
    if (
      existingGroup.type !== type ||
      normalized(existingGroup.meaning) !== normalized(meaning) ||
      existingGroup.category !== resolvedCategory ||
      existingGroup.status !== status
    ) {
      errors.push({
        line: record.line,
        message: `Rows for "${word}" must use the same meaning, type, category, and status.`,
      });
      invalidGroups.add(key);
      return;
    }
  } else {
    groups.set(key, {
      word,
      type,
      meaning,
      category: resolvedCategory,
      status,
      detailedMeanings: [],
      seenMeanings: new Set(),
      ipa,
    });
  }

  const group = groups.get(key)!;
  if (!group.ipa && ipa) group.ipa = ipa;
  if (partOfSpeech && detailedMeaning) {
    const meaningKey = `${normalized(partOfSpeech)}\u0000${normalized(detailedMeaning)}`;
    if (!group.seenMeanings.has(meaningKey)) {
      group.seenMeanings.add(meaningKey);
      group.detailedMeanings.push({ partOfSpeech, meaning: detailedMeaning });
    }
  }
}

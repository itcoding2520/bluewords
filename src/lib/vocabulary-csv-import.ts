import { parseRecords } from "@/lib/vocabulary-csv-parser";
import { processVocabularyCsvRow, type VocabularyCsvWordGroup } from "@/lib/vocabulary-csv-row";
import {
  MAX_VOCABULARY_IMPORT_WORDS,
  type VocabularyCsvPreview,
  type VocabularyCsvWord,
} from "@/lib/vocabulary-csv-shared";
import { normalizeVocabularyKey } from "@/lib/vocabulary/normalize-text";

const REQUIRED_CSV_HEADERS = ["word", "type", "meaning", "category", "status"];

export function previewVocabularyCsvImport(
  csv: string,
  categoryNames: string[],
  existingWords: string[]
): VocabularyCsvPreview {
  const parsed = parseRecords(csv);
  const errors = [...parsed.errors];

  if (parsed.records.length === 0) {
    return {
      items: [],
      errors: errors.length
        ? errors
        : [{ line: 1, message: "The CSV file is empty." }],
      duplicates: 0,
      categoryFallbacks: 0,
      totalRows: 0,
    };
  }

  const header = parsed.records[0].fields.map(normalizeVocabularyKey);
  const columnIndex = new Map<string, number>();
  const duplicateHeaders = new Set<string>();
  for (const [index, name] of header.entries()) {
    if (columnIndex.has(name)) duplicateHeaders.add(name);
    else columnIndex.set(name, index);
  }
  const missingHeaders = REQUIRED_CSV_HEADERS.filter((name) => !columnIndex.has(name));

  if (missingHeaders.length || duplicateHeaders.size) {
    const problems = [
      ...(missingHeaders.length
        ? [`Missing columns: ${missingHeaders.join(", ")}.`]
        : []),
      ...(duplicateHeaders.size
        ? [`Duplicate columns: ${[...duplicateHeaders].join(", ")}.`]
        : []),
    ];

    return {
      items: [],
      errors: [
        ...errors,
        ...problems.map((message) => ({ line: parsed.records[0].line, message })),
      ],
      duplicates: 0,
      categoryFallbacks: 0,
      totalRows: Math.max(0, parsed.records.length - 1),
    };
  }

  const categoriesByName = new Map<string, string>();
  for (const name of categoryNames) categoriesByName.set(normalizeVocabularyKey(name), name);
  const existing = new Set<string>();
  for (const word of existingWords) existing.add(normalizeVocabularyKey(word));
  const groups = new Map<string, VocabularyCsvWordGroup>();
  const invalidGroups = new Set<string>();
  const duplicateWords = new Set<string>();
  const fallbackWords = new Set<string>();

  for (const record of parsed.records.slice(1)) {
    processVocabularyCsvRow({
      record,
      headerLength: header.length,
      columnIndex,
      categoriesByName,
      existing,
      groups,
      invalidGroups,
      duplicateWords,
      fallbackWords,
      errors,
    });
  }

  const items: VocabularyCsvWord[] = [];
  for (const [key, group] of groups) {
    if (invalidGroups.has(key)) continue;

    items.push({
      word: group.word,
      meaning: group.meaning,
      type: group.type,
      category: group.category,
      status: group.status,
      imagePath: null,
      ipa: group.ipa,
      detailedMeanings: group.detailedMeanings,
    });
  }

  const exceedsImportLimit = items.length > MAX_VOCABULARY_IMPORT_WORDS;
  if (exceedsImportLimit) {
    errors.push({
      line: parsed.records[0].line,
      message: `Import is limited to ${MAX_VOCABULARY_IMPORT_WORDS} new words at a time. Split this file and try again.`,
    });
  }

  return {
    items: exceedsImportLimit ? [] : items,
    errors,
    duplicates: duplicateWords.size,
    categoryFallbacks: [...fallbackWords].filter((key) => groups.has(key) && !invalidGroups.has(key)).length,
    totalRows: Math.max(0, parsed.records.length - 1),
  };
}

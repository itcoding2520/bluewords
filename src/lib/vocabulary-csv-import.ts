import { parseRecords } from "@/lib/vocabulary-csv-parser";
import { processVocabularyCsvRow, type VocabularyCsvWordGroup } from "@/lib/vocabulary-csv-row";
import {
  MAX_VOCABULARY_IMPORT_WORDS,
  type VocabularyCsvPreview,
  type VocabularyCsvWord,
} from "@/lib/vocabulary-csv-shared";

const REQUIRED_CSV_HEADERS = ["word", "type", "meaning", "category", "status"];

function normalized(value: string): string {
  return value.trim().toLowerCase();
}

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

  const header = parsed.records[0].fields.map((value) => normalized(value));
  const missingHeaders = REQUIRED_CSV_HEADERS.filter(
    (name) => !header.includes(name)
  );
  const duplicateHeaders = header.filter(
    (name, index) => header.indexOf(name) !== index
  );

  if (missingHeaders.length || duplicateHeaders.length) {
    const problems = [
      ...(missingHeaders.length
        ? [`Missing columns: ${missingHeaders.join(", ")}.`]
        : []),
      ...(duplicateHeaders.length
        ? [`Duplicate columns: ${[...new Set(duplicateHeaders)].join(", ")}.`]
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

  const columnIndex = new Map(header.map((name, index) => [name, index]));
  const categoriesByName = new Map(
    categoryNames.map((name) => [normalized(name), name])
  );
  const existing = new Set(existingWords.map(normalized));
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

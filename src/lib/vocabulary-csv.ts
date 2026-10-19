import {
  PARTS_OF_SPEECH,
  type PartOfSpeech,
  type VocabularyType,
} from "@/config/vocabulary";
import type { VocabularyWord } from "@/data/vocabulary";

export const MAX_VOCABULARY_IMPORT_WORDS = 50;

export const VOCABULARY_CSV_HEADERS = [
  "word",
  "type",
  "part_of_speech",
  "meaning",
  "category",
  "status",
  "ipa",
] as const;

const REQUIRED_CSV_HEADERS = VOCABULARY_CSV_HEADERS.filter(
  (header) => header !== "ipa"
);

export type VocabularyCsvWord = Omit<VocabularyWord, "id">;

export interface VocabularyCsvIssue {
  line: number;
  message: string;
}

export interface VocabularyCsvPreview {
  items: VocabularyCsvWord[];
  errors: VocabularyCsvIssue[];
  duplicates: number;
  categoryFallbacks: number;
  totalRows: number;
}

interface CsvRecord {
  line: number;
  fields: string[];
}

interface CsvParseResult {
  records: CsvRecord[];
  errors: VocabularyCsvIssue[];
}

interface WordGroup {
  word: string;
  type: VocabularyType;
  category: string;
  status: VocabularyWord["status"];
  meanings: Array<{ partOfSpeech: PartOfSpeech; meaning: string }>;
  plainMeanings: string[];
  seenMeanings: Set<string>;
  ipa: string | null;
}

function parseRecords(input: string): CsvParseResult {
  const source = input.replace(/^\uFEFF/, "");
  const records: CsvRecord[] = [];
  const errors: VocabularyCsvIssue[] = [];
  let fields: string[] = [];
  let field = "";
  let line = 1;
  let recordLine = 1;
  let inQuotes = false;
  let afterQuote = false;

  function finishField() {
    fields.push(field);
    field = "";
    afterQuote = false;
  }

  function finishRecord() {
    finishField();
    if (fields.some((value) => value.trim() !== "")) {
      records.push({ line: recordLine, fields });
    }
    fields = [];
    recordLine = line + 1;
  }

  for (let index = 0; index < source.length; index++) {
    const character = source[index];

    if (inQuotes) {
      if (character === '"') {
        if (source[index + 1] === '"') {
          field += '"';
          index++;
        } else {
          inQuotes = false;
          afterQuote = true;
        }
      } else {
        field += character;
        if (character === "\n") line++;
        else if (character === "\r" && source[index + 1] !== "\n") line++;
      }
      continue;
    }

    if (character === '"') {
      if (field.trim() !== "" || afterQuote) {
        errors.push({
          line,
          message: "Unexpected quote in an unquoted field.",
        });
      } else {
        field = "";
        inQuotes = true;
      }
      continue;
    }

    if (afterQuote && character !== "," && character !== "\n" && character !== "\r" && character.trim() !== "") {
      errors.push({
        line,
        message: "Only a comma or line break can follow a closing quote.",
      });
      afterQuote = false;
    }

    if (character === ",") {
      finishField();
    } else if (character === "\n") {
      finishRecord();
      line++;
      recordLine = line;
    } else if (character === "\r") {
      finishRecord();
      if (source[index + 1] === "\n") index++;
      line++;
      recordLine = line;
    } else {
      field += character;
    }
  }

  if (inQuotes) {
    errors.push({ line: recordLine, message: "Quoted field is not closed." });
  }

  if (field !== "" || fields.length > 0) {
    finishRecord();
  }

  return { records, errors };
}

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
  const groups = new Map<string, WordGroup>();
  const invalidGroups = new Set<string>();
  const duplicateWords = new Set<string>();
  const fallbackWords = new Set<string>();

  for (const record of parsed.records.slice(1)) {
    if (record.fields.length !== header.length) {
      errors.push({
        line: record.line,
        message: `Expected ${header.length} columns, found ${record.fields.length}.`,
      });
      continue;
    }

    const value = (name: (typeof VOCABULARY_CSV_HEADERS)[number]) =>
      (record.fields[columnIndex.get(name)!] ?? "").trim();
    const word = value("word");
    const typeValue = normalized(value("type"));
    const partOfSpeechValue = normalized(value("part_of_speech"));
    const meaning = value("meaning");
    const rawCategory = value("category");
    const statusValue = normalized(value("status"));
    const ipa = columnIndex.has("ipa") ? value("ipa") || null : null;
    const key = normalized(word);

    if (!word) {
      errors.push({ line: record.line, message: "Word is required." });
      continue;
    }

    if (existing.has(key)) {
      duplicateWords.add(key);
      continue;
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

    const category = categoriesByName.get(normalized(rawCategory));
    if (!category) fallbackWords.add(key);

    if (rowErrors.length) {
      rowErrors.forEach((message) => errors.push({ line: record.line, message }));
      invalidGroups.add(key);
      continue;
    }

    const type = typeValue as VocabularyType;
    const status = statusValue as VocabularyWord["status"];
    const resolvedCategory = category ?? "Uncategorized";
    const existingGroup = groups.get(key);

    if (existingGroup) {
      if (
        existingGroup.type !== type ||
        existingGroup.category !== resolvedCategory ||
        existingGroup.status !== status
      ) {
        errors.push({
          line: record.line,
          message: `Rows for "${word}" must use the same type, category, and status.`,
        });
        invalidGroups.add(key);
        continue;
      }
    } else {
      groups.set(key, {
        word,
        type,
        category: resolvedCategory,
        status,
        meanings: [],
        plainMeanings: [],
        seenMeanings: new Set(),
        ipa,
      });
    }

    const group = groups.get(key)!;
    if (!group.ipa && ipa) group.ipa = ipa;
    if (partOfSpeech) {
      const meaningKey = `${normalized(partOfSpeech)}\u0000${normalized(meaning)}`;
      if (!group.seenMeanings.has(meaningKey)) {
        group.seenMeanings.add(meaningKey);
        group.meanings.push({ partOfSpeech, meaning });
      }
    } else if (!group.plainMeanings.some((item) => normalized(item) === normalized(meaning))) {
      group.plainMeanings.push(meaning);
    }
  }

  const items: VocabularyCsvWord[] = [];
  for (const [key, group] of groups) {
    if (invalidGroups.has(key)) continue;

    const allMeanings = [
      ...group.meanings.map((item) => item.meaning),
      ...group.plainMeanings,
    ];

    items.push({
      word: group.word,
      meaning: allMeanings.join("; "),
      type: group.type,
      category: group.category,
      status: group.status,
      imagePath: null,
      ipa: group.ipa,
      detailedMeanings: group.meanings,
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

function escapeCsv(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function exportVocabularyCsv(words: VocabularyWord[]): string {
  const rows: string[][] = [
    [...VOCABULARY_CSV_HEADERS],
  ];

  for (const word of words) {
    const meanings = word.detailedMeanings?.filter(
      (item) => item.meaning.trim()
    );

    if (meanings?.length) {
      for (const item of meanings) {
        rows.push([
          word.word,
          word.type ?? "word",
          item.partOfSpeech,
          item.meaning,
          word.category,
          word.status,
          word.ipa ?? "",
        ]);
      }
    } else {
      rows.push([
        word.word,
        word.type ?? "word",
        "",
        word.meaning,
        word.category,
        word.status,
        word.ipa ?? "",
      ]);
    }
  }

  return `\uFEFF${rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n")}`;
}

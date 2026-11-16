import type { PartOfSpeech, VocabularyType } from "@/config/vocabulary";
import type { VocabularyWord } from "@/data/vocabulary";
import type { CsvRecord } from "@/lib/vocabulary-csv-parser";
import type { VocabularyCsvIssue } from "@/lib/vocabulary-csv-shared";
import { normalizeVocabularyKey } from "@/lib/vocabulary/normalize-text";
import { readVocabularyCsvRow, validateVocabularyCsvRow } from "@/lib/vocabulary-csv-row-validation";

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
  const { values, errors: rowErrors } = readVocabularyCsvRow(
    record,
    headerLength,
    columnIndex
  );
  if (!values) {
    rowErrors.forEach((message) => errors.push({ line: record.line, message }));
    return;
  }

  const { word, typeValue, meaning, category: rawCategory, statusValue, detailedMeaning, partOfSpeech, ipa } = values;
  const key = normalizeVocabularyKey(word);

  if (!word) {
    rowErrors.forEach((message) => errors.push({ line: record.line, message }));
    return;
  }

  if (existing.has(key)) {
    duplicateWords.add(key);
    return;
  }

  rowErrors.push(...validateVocabularyCsvRow(values));
  if (rowErrors.length) {
    rowErrors.forEach((message) => errors.push({ line: record.line, message }));
    invalidGroups.add(key);
    return;
  }

  const category = categoriesByName.get(normalizeVocabularyKey(rawCategory));
  if (!category) fallbackWords.add(key);
  const type = typeValue as VocabularyType;
  const status = statusValue as VocabularyWord["status"];
  const resolvedCategory = category ?? "Uncategorized";
  const existingGroup = groups.get(key);

  if (existingGroup) {
    if (
      existingGroup.type !== type ||
      normalizeVocabularyKey(existingGroup.meaning) !== normalizeVocabularyKey(meaning) ||
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
    const meaningKey = `${normalizeVocabularyKey(partOfSpeech)}\u0000${normalizeVocabularyKey(detailedMeaning)}`;
    if (!group.seenMeanings.has(meaningKey)) {
      group.seenMeanings.add(meaningKey);
      group.detailedMeanings.push({ partOfSpeech, meaning: detailedMeaning });
    }
  }
}

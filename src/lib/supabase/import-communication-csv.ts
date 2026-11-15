import type { SupabaseClient } from "@/lib/supabase/client";
import { parseCommunicationCsvDetailed } from "@/lib/communication/csv";
import { ensureTopicAndLessonIds } from "@/lib/supabase/communication-csv-import-hierarchy";
import { importNewCommunicationItems } from "@/lib/supabase/communication-csv-import-items";
import { importNewCommunicationTurns } from "@/lib/supabase/communication-csv-import-dialogues";

export type CommunicationCsvImportResult = {
  importedItems: number;
  importedTurns: number;
  skippedRows: number;
  skippedRowNumbers: number[];
  duplicateRowsInFile: number[];
  hasContentRows: boolean;
};

export async function importCommunicationCsv(
  supabase: SupabaseClient,
  csv: string,
): Promise<CommunicationCsvImportResult> {
  const parsed = parseCommunicationCsvDetailed(csv);
  const records = parsed.records;
  if (!records.length) {
    return {
      importedItems: 0,
      importedTurns: 0,
      skippedRows: 0,
      skippedRowNumbers: [],
      duplicateRowsInFile: parsed.duplicates.map((duplicate) => duplicate.row),
      hasContentRows: false,
    };
  }

  const lessonsByKey = await ensureTopicAndLessonIds(supabase, records);
  const items = await importNewCommunicationItems(supabase, records, lessonsByKey);
  const dialogueRecords = records.filter((row) => row.record_type === "dialogue_turn");
  const turns = await importNewCommunicationTurns(supabase, dialogueRecords, lessonsByKey);
  const skippedRowNumbers = [
    ...parsed.duplicates.map((duplicate) => duplicate.row),
    ...records.flatMap((row, index) =>
      (row.record_type === "item" && items.existingItemKeys.has(row.record_key))
      || (row.record_type === "dialogue_turn" && turns.skippedTurnKeys.has(row.record_key))
        ? [parsed.recordRows[index]] : []),
  ].sort((a, b) => a - b);

  return {
    importedItems: items.itemCount,
    importedTurns: turns.turnCount,
    skippedRows: parsed.duplicates.length + items.skippedExistingRows + turns.skippedTurnKeys.size,
    skippedRowNumbers,
    duplicateRowsInFile: parsed.duplicates.map((duplicate) => duplicate.row),
    hasContentRows: true,
  };
}

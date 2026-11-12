import { useRef, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";

import type { createClient } from "@/lib/supabase/client";
import { exportCommunicationCsv } from "@/lib/supabase/situational-english";
import { importCommunicationCsv } from "@/lib/supabase/import-communication-csv";
import { loadCommunicationSituationExport } from "@/lib/supabase/export-communication-situation";

type SupabaseClient = ReturnType<typeof createClient>;

type Options = {
  supabase: SupabaseClient;
  selectedTopicId: string;
  setBusy: Dispatch<SetStateAction<boolean>>;
  onRefresh: () => Promise<void>;
};

export function useAdminCommunicationCsvActions({ supabase, selectedTopicId, setBusy, onRefresh }: Options) {
  const fileRef = useRef<HTMLInputElement>(null);

  async function importCsv(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      const result = await importCommunicationCsv(supabase, await file.text());
      if (!result.hasContentRows) {
        toast.info(result.duplicateRowsInFile.length ? `No new rows to import. Skipped ${result.duplicateRowsInFile.length} duplicate CSV rows.` : "The CSV has no content rows.");
        return;
      }
      const imported = result.importedItems + result.importedTurns;
      if (result.skippedRows) {
        const rowDetails = result.skippedRowNumbers.length ? ` Skipped CSV rows: ${[...new Set(result.skippedRowNumbers)].join(", ")}.` : "";
        toast.success(`Imported ${imported} new rows (${result.importedItems} items, ${result.importedTurns} dialogue turns). Skipped ${result.skippedRows} duplicate rows.${rowDetails}`);
      } else {
        toast.success(`Imported ${imported} rows (${result.importedItems} items, ${result.importedTurns} dialogue turns).`);
      }
      await onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "CSV import failed.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function exportCsv() {
    if (!selectedTopicId) {
      toast.error("Select a situation before exporting its CSV.");
      return;
    }
    setBusy(true);
    try {
      const { topicSlug, records } = await loadCommunicationSituationExport(supabase, selectedTopicId);
      const blob = new Blob(["\uFEFF", exportCommunicationCsv(records)], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `BlueWords_Situational_English_${topicSlug}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${records.length} content rows.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not export communication content.");
    } finally {
      setBusy(false);
    }
  }

  return { fileRef, importCsv, exportCsv };
}

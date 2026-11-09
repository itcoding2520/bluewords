"use client";

import { useRef, type Dispatch, type SetStateAction } from "react";
import { Download, FileUp, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import type { createClient } from "@/lib/supabase/client";
import { exportCommunicationCsv } from "@/lib/supabase/situational-english";
import { importCommunicationCsv } from "@/lib/supabase/import-communication-csv";
import { loadCommunicationSituationExport } from "@/lib/supabase/export-communication-situation";

type SupabaseClient = ReturnType<typeof createClient>;

type Props = {
  supabase: SupabaseClient;
  selectedTopicId: string;
  busy: boolean;
  setBusy: Dispatch<SetStateAction<boolean>>;
  onRefresh: () => Promise<void>;
};

export function AdminCommunicationCsvActions({ supabase, selectedTopicId, busy, setBusy, onRefresh }: Props) {
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

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => void onRefresh()} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-sky-200 bg-white px-3 text-sm font-semibold text-blue-700">
        <RefreshCw size={16} /> Refresh
      </button>
      <button type="button" disabled={busy} onClick={() => fileRef.current?.click()} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-sky-200 bg-white px-3 text-sm font-semibold text-blue-700">
        <FileUp size={16} /> Import CSV
      </button>
      <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => void importCsv(event.target.files?.[0])} />
      <button type="button" title="Export the selected situation only" aria-label="Export selected situation CSV" disabled={busy || !selectedTopicId} onClick={() => void exportCsv()} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-600 px-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
        <Download size={16} /> Export situation
      </button>
    </div>
  );
}

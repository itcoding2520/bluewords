import { getErrorMessage } from "@/lib/errors";
import { useRef, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import { downloadCsvFile } from "@/lib/download-csv";
import type { SupabaseClient } from "@/lib/supabase/client";
import {
  importSentenceBuilderQuestions,
  loadSentenceBuilderQuestions,
} from "@/lib/supabase/sentence-builder";
import { exportSentenceBuilderCsv, parseSentenceBuilderCsv } from "@/lib/sentence-builder-csv";

export function useAdminSentenceBuilderCsvActions(input: {
  supabase: SupabaseClient;
  setBusy: Dispatch<SetStateAction<boolean>>;
  refresh: () => Promise<void>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  async function importCsv(file?: File) {
    if (!file) return;
    input.setBusy(true);
    try {
      const rows = parseSentenceBuilderCsv(await file.text());
      const { error } = await importSentenceBuilderQuestions(input.supabase, rows);
      if (error) throw error;
      toast.success(`Imported ${rows.length} questions.`);
      await input.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error, "CSV import failed."));
    } finally {
      input.setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function exportCsv() {
    try {
      const rows = await loadSentenceBuilderQuestions(false);
      downloadCsvFile(
        "BlueWords_Sentence_Builder_Questions.csv",
        exportSentenceBuilderCsv(rows),
        { includeUtf8Bom: true }
      );
    } catch {
      toast.error("Could not export questions.");
    }
  }

  return { fileRef, importCsv, exportCsv };
}

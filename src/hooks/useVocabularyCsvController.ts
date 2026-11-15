import { useState } from "react";
import { toast } from "sonner";
import { downloadCsvFile } from "@/lib/download-csv";
import type { VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { useVocabularyCsvImport } from "@/hooks/useVocabularyCsvImport";
import {
  exportVocabularyCsv,
} from "@/lib/vocabulary-csv";

export function useVocabularyCsvController({
  exportCount,
  loadExportWords,
  exportCategory,
  categories,
  onImportComplete,
}: {
  exportCount: number;
  loadExportWords: () => Promise<VocabularyWord[]>;
  exportCategory: string;
  categories: VocabularyCategoryRow[];
  onImportComplete: () => void;
}) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const importController = useVocabularyCsvImport({ categories, onImportComplete });

  async function exportCsv() {
    if (exportCount === 0) {
      toast.info("There are no words to export yet.");
      return;
    }

    setIsExporting(true);
    try {
      const wordsToExport = await loadExportWords();
      const date = new Date();
      const dateSuffix = `${String(date.getDate()).padStart(2, "0")}${String(date.getMonth() + 1).padStart(2, "0")}${date.getFullYear()}`;
      const categoryFileName = exportCategory
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "") || "All";
      downloadCsvFile(
        `${categoryFileName}_${dateSuffix}.csv`,
        exportVocabularyCsv(wordsToExport),
        { appendLinkToDocument: true, revokeAfterMs: 1000 }
      );
      toast.success(`Exported ${wordsToExport.length} words.`);
      setExportOpen(false);
    } finally {
      setIsExporting(false);
    }
  }

  return {
    isExporting,
    exportOpen,
    setExportOpen,
    exportCsv,
    ...importController,
  };
}

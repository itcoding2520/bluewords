"use client";

import { Download, FileUp } from "lucide-react";

import { Button } from "@/components/ui/Button";
import type { VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { useVocabularyCsvController } from "@/hooks/useVocabularyCsvController";
import { VocabularyCsvImportDialog } from "@/components/vocabulary/VocabularyCsvImportDialog";
import { VocabularyCsvExportDialog } from "@/components/vocabulary/VocabularyCsvExportDialog";

interface VocabularyCsvToolsProps {
  exportCount: number;
  isExportCountLoading: boolean;
  loadExportWords: () => Promise<VocabularyWord[]>;
  exportCategory: string;
  categories: VocabularyCategoryRow[];
  onImportComplete: () => void;
}

export function VocabularyCsvTools({
  exportCount,
  isExportCountLoading,
  loadExportWords,
  exportCategory,
  categories,
  onImportComplete,
}: VocabularyCsvToolsProps) {
  const {
    fileInputRef,
    imageInputRef,
    open,
    setOpen,
    fileName,
    imageFiles,
    preview,
    isReading,
    isImporting,
    isExporting,
    exportOpen,
    setExportOpen,
    imageMatch,
    openImport: handleOpenImport,
    exportCsv: handleExport,
    readCsvFile: handleFileChange,
    selectImageFiles: handleImageFilesChange,
    importCsv: handleImport,
  } = useVocabularyCsvController({ exportCount, loadExportWords, exportCategory, categories, onImportComplete });

  return (
    <>
      <div className="vocabulary-csv-tools flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => void handleOpenImport()}>
          <FileUp size={16} />
          Import CSV
        </Button>
        <Button variant="secondary" onClick={() => setExportOpen(true)}>
          <Download size={16} />
          Export CSV
        </Button>
      </div>

      <VocabularyCsvExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        category={exportCategory}
        wordCount={exportCount}
        isWordCountLoading={isExportCountLoading}
        isExporting={isExporting}
        onExport={() => void handleExport()}
      />

      <VocabularyCsvImportDialog
        open={open}
        onOpenChange={setOpen}
        fileInputRef={fileInputRef}
        imageInputRef={imageInputRef}
        fileName={fileName}
        imageFiles={imageFiles}
        preview={preview}
        isReading={isReading}
        isImporting={isImporting}
        imageMatch={imageMatch}
        onFileChange={handleFileChange}
        onImageFilesChange={handleImageFilesChange}
        onImport={() => void handleImport()}
      />
    </>
  );
}

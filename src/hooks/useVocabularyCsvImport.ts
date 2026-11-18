import { useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { useVocabulary } from "@/contexts/VocabularyContext";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import {
  MAX_VOCABULARY_IMPORT_WORDS,
  previewVocabularyCsvImport,
  type VocabularyCsvPreview,
} from "@/lib/vocabulary-csv";
import { useVocabularyCsvImageSelection } from "@/hooks/useVocabularyCsvImageSelection";
import { runWithBusyState } from "@/lib/run-with-busy-state";

export function useVocabularyCsvImport({
  categories,
  onImportComplete,
}: {
  categories: VocabularyCategoryRow[];
  onImportComplete: () => void;
}) {
  const { importWords, refreshWords, words: allWords } = useVocabulary({
    loadWords: false,
    loadCategories: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<VocabularyCsvPreview | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const imageSelection = useVocabularyCsvImageSelection({
    words: allWords,
    preview,
  });

  async function openImport() {
    await refreshWords();
    setOpen(true);
  }

  async function readCsvFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    await runWithBusyState(setIsReading, async () => {
      setFileName(file.name);
      setPreview(null);
      try {
        const csv = await file.text();
        setPreview(previewVocabularyCsvImport(
          csv,
          categories.map((category) => category.name),
          allWords.map((word) => word.word),
        ));
      } catch (error) {
        console.error("Failed to read CSV file:", error);
        toast.error("Could not read this CSV file.");
        setFileName("");
      }
    });
  }

  async function importCsv() {
    if (!preview || preview.items.length === 0 || isImporting) return;

    await runWithBusyState(setIsImporting, async () => {
      const result = await importWords(preview.items, imageSelection.imageMatch.imageFilesByWord);
      if (result.limitExceeded) {
        toast.error(`Import is limited to ${MAX_VOCABULARY_IMPORT_WORDS} words at a time.`);
        return;
      }
      const duplicateTotal = preview.duplicates + result.duplicates;
      if (result.imported > 0) toast.success(`Imported ${result.imported} words and ${result.imagesUploaded} images.`);
      if (result.imagesFailed > 0) toast.error(`${result.imagesFailed} image(s) could not be uploaded. The vocabulary words were still imported.`);
      if (duplicateTotal > 0) toast.info(`Skipped ${duplicateTotal} duplicate words.`);
      if (result.failed > 0 || preview.errors.length > 0) {
        toast.error(`${result.failed + preview.errors.length} rows could not be imported.`);
      }

      setPreview(null);
      setFileName("");
      imageSelection.clearImageFiles();
      if (result.failed === 0) setOpen(false);
      if (result.imported > 0 || result.imagesUploaded > 0) onImportComplete();
    });
  }

  return {
    dialog: { open, setOpen, isReading, isImporting },
    files: {
      csvInputRef: fileInputRef,
      imageInputRef: imageSelection.imageInputRef,
      fileName,
      imageFiles: imageSelection.imageFiles,
    },
    preview: { content: preview, imageMatch: imageSelection.imageMatch },
    actions: {
      openImport,
      readCsvFile,
      selectImageFiles: imageSelection.selectImageFiles,
      importCsv,
    },
  };
}

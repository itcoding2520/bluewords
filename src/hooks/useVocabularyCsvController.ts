"use client";

import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { downloadCsvFile } from "@/lib/download-csv";

import { useVocabulary } from "@/contexts/VocabularyContext";
import type { VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { validateVocabularyImage } from "@/lib/supabase/vocabulary-images";
import { matchVocabularyImportImages } from "@/lib/vocabulary-image-matching";
import {
  MAX_VOCABULARY_IMPORT_WORDS,
  exportVocabularyCsv,
  previewVocabularyCsvImport,
  type VocabularyCsvPreview,
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
  const { importWords, refreshWords, words: allWords } = useVocabulary({ loadWords: false, loadCategories: false });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<VocabularyCsvPreview | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const imageMatch = useMemo(() => {
    return matchVocabularyImportImages(
      imageFiles,
      (preview?.items ?? []).map((item) => item.word),
      allWords,
      (file) => validateVocabularyImage(file) === null
    );
  }, [allWords, imageFiles, preview]);

  async function openImport() {
    await refreshWords();
    setOpen(true);
  }

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

  async function readCsvFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsReading(true);
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
    } finally {
      setIsReading(false);
    }
  }

  function selectImageFiles(event: ChangeEvent<HTMLInputElement>) {
    const selectedImages = Array.from(event.target.files ?? []).filter((file) =>
      file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(file.name)
    );
    setImageFiles(selectedImages);
    event.currentTarget.value = "";
  }

  async function importCsv() {
    if (!preview || preview.items.length === 0 || isImporting) return;

    setIsImporting(true);
    try {
      const result = await importWords(preview.items, imageMatch.imageFilesByWord);
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
      setImageFiles([]);
      if (imageInputRef.current) imageInputRef.current.value = "";
      if (result.failed === 0) setOpen(false);
      if (result.imported > 0 || result.imagesUploaded > 0) onImportComplete();
    } finally {
      setIsImporting(false);
    }
  }

  return {
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
    openImport,
    exportCsv,
    readCsvFile,
    selectImageFiles,
    importCsv,
  };
}

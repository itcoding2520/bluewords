"use client";

import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { downloadCsvFile } from "@/lib/download-csv";

import { useVocabulary } from "@/contexts/VocabularyContext";
import type { VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { validateVocabularyImage } from "@/lib/supabase/vocabulary-images";
import {
  MAX_VOCABULARY_IMPORT_WORDS,
  exportVocabularyCsv,
  previewVocabularyCsvImport,
  type VocabularyCsvPreview,
} from "@/lib/vocabulary-csv";

function normalizeImageName(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]/g, "");
}

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
    const supported = imageFiles.filter((file) => !validateVocabularyImage(file));
    const invalidCount = imageFiles.length - supported.length;
    const filesByName = new Map<string, File>();
    const ambiguousNames = new Set<string>();

    for (const file of supported) {
      const key = normalizeImageName(file.name);
      if (filesByName.has(key)) {
        filesByName.delete(key);
        ambiguousNames.add(key);
      } else if (!ambiguousNames.has(key)) {
        filesByName.set(key, file);
      }
    }

    const imageFilesByWord = new Map<string, File>();
    const importableNames = new Set((preview?.items ?? []).map((item) => normalizeImageName(item.word)));
    const currentWordsByName = new Map(allWords.map((word) => [normalizeImageName(word.word), word]));
    let alreadyHasImage = 0;

    for (const [key, file] of filesByName) {
      if (ambiguousNames.has(key)) continue;
      const existingWord = currentWordsByName.get(key);
      if (existingWord && !existingWord.imagePath) imageFilesByWord.set(key, file);
      else if (existingWord?.imagePath) alreadyHasImage++;
      else if (importableNames.has(key)) imageFilesByWord.set(key, file);
    }

    return {
      imageFilesByWord,
      matched: imageFilesByWord.size,
      unmatched: [...filesByName.keys()].filter((key) =>
        !importableNames.has(key) && !currentWordsByName.has(key)
      ).length + ambiguousNames.size,
      invalidCount,
      alreadyHasImage,
    };
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

"use client";

import { useMemo, useRef, useState, type ChangeEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Download, FileUp, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { useVocabulary } from "@/contexts/VocabularyContext";
import type { VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import {
  MAX_VOCABULARY_IMPORT_WORDS,
  exportVocabularyCsv,
  previewVocabularyCsvImport,
  type VocabularyCsvPreview,
} from "@/lib/vocabulary-csv";
import { validateVocabularyImage } from "@/lib/supabase/vocabulary-images";

function normalizeImageName(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]/g, "");
}

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
      if (existingWord && !existingWord.imagePath) {
        imageFilesByWord.set(key, file);
      } else if (existingWord?.imagePath) {
        alreadyHasImage++;
      } else if (importableNames.has(key)) {
        imageFilesByWord.set(key, file);
      }
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

  async function handleOpenImport() {
    await refreshWords();
    setOpen(true);
  }

  async function handleExport() {
    if (exportCount === 0) {
      toast.info("There are no words to export yet.");
      return;
    }

    setIsExporting(true);
    try {
      const wordsToExport = await loadExportWords();
      const blob = new Blob([exportVocabularyCsv(wordsToExport)], {
        type: "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const date = new Date();
      const dateSuffix = `${String(date.getDate()).padStart(2, "0")}${String(
        date.getMonth() + 1
      ).padStart(2, "0")}${date.getFullYear()}`;
      const categoryFileName = exportCategory
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "") || "All";
      link.download = `${categoryFileName}_${dateSuffix}.csv`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success(`Exported ${wordsToExport.length} words.`);
      setExportOpen(false);
    } finally {
      setIsExporting(false);
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsReading(true);
    setFileName(file.name);
    setPreview(null);

    try {
      const csv = await file.text();
      setPreview(
        previewVocabularyCsvImport(
          csv,
          categories.map((category) => category.name),
          allWords.map((word) => word.word)
        )
      );
    } catch (error) {
      console.error("Failed to read CSV file:", error);
      toast.error("Could not read this CSV file.");
      setFileName("");
    } finally {
      setIsReading(false);
    }
  }

  function handleImageFilesChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedImages = Array.from(event.target.files ?? []).filter((file) =>
      file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(file.name)
    );
    setImageFiles(selectedImages);
    event.currentTarget.value = "";
  }

  async function handleImport() {
    if (!preview || preview.items.length === 0 || isImporting) return;

    setIsImporting(true);
    try {
      const result = await importWords(preview.items, imageMatch.imageFilesByWord);
      if (result.limitExceeded) {
        toast.error(`Import is limited to ${MAX_VOCABULARY_IMPORT_WORDS} words at a time.`);
        return;
      }
      const duplicateTotal = preview.duplicates + result.duplicates;

      if (result.imported > 0) {
        toast.success(`Imported ${result.imported} words and ${result.imagesUploaded} images.`);
      }
      if (result.imagesFailed > 0) {
        toast.error(`${result.imagesFailed} image(s) could not be uploaded. The vocabulary words were still imported.`);
      }
      if (duplicateTotal > 0) {
        toast.info(`Skipped ${duplicateTotal} duplicate words.`);
      }
      if (result.failed > 0 || preview.errors.length > 0) {
        toast.error(
          `${result.failed + preview.errors.length} rows could not be imported.`
        );
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

  return (
    <>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => void handleOpenImport()}>
          <FileUp size={16} />
          Import CSV
        </Button>
        <Button variant="secondary" onClick={() => setExportOpen(true)}>
          <Download size={16} />
          Export CSV
        </Button>
      </div>

      <Dialog.Root open={exportOpen} onOpenChange={(nextOpen) => {
        if (!isExporting) setExportOpen(nextOpen);
      }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-sm" />
          <Dialog.Content className="hide-scrollbar fixed left-1/2 top-1/2 z-50 w-[calc(100%-24px)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-xl sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Dialog.Title className="text-lg font-semibold text-slate-950">
                  Confirm vocabulary export
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-slate-500">
                  Review the data that will be included in your CSV file.
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close"
                  disabled={isExporting}
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
                >
                  <X size={18} />
                </button>
              </Dialog.Close>
            </div>

            <dl className="mt-5 space-y-3 rounded-xl bg-slate-50 p-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Category</dt>
                <dd className="font-medium text-slate-900">{exportCategory}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Words</dt>
                <dd className="font-medium text-slate-900">{isExportCountLoading ? "Loading…" : exportCount}</dd>
              </div>
              {exportCategory === "All" && (
                <p className="text-xs text-slate-500">
                  All is selected, so only words on the current page (including the active search) will be exported.
                </p>
              )}
            </dl>

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setExportOpen(false)} disabled={isExporting}>
                Cancel
              </Button>
              <Button onClick={() => void handleExport()} disabled={isExporting || isExportCountLoading || exportCount === 0}>
                <Download size={16} />
                {isExporting ? "Exporting..." : "Export"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root
        open={open}
        onOpenChange={(nextOpen) => {
          if (!isReading && !isImporting) setOpen(nextOpen);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-sm" />
          <Dialog.Content className="hide-scrollbar fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-24px)] w-[calc(100%-24px)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:max-h-[calc(100dvh-48px)] sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Dialog.Title className="text-lg font-semibold text-slate-950 sm:text-xl">
                  Import vocabulary from CSV
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-slate-500">
                  Preview rows before adding them to your account.
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close"
                  disabled={isReading || isImporting}
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
                >
                  <X size={18} />
                </button>
              </Dialog.Close>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              aria-label="Choose CSV file"
              onChange={(event) => void handleFileChange(event)}
              className="sr-only"
            />
            <input
              ref={(element) => {
                imageInputRef.current = element;
                element?.setAttribute("webkitdirectory", "");
              }}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              aria-label="Choose image folder"
              onChange={handleImageFilesChange}
              className="sr-only"
            />

            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
              <p className="text-sm text-slate-600">
                {isReading
                  ? "Reading CSV..."
                  : fileName || "Choose a CSV file to preview its contents."}
              </p>
              <Button
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={isReading || isImporting}
                className="mt-3"
              >
                <FileUp size={16} />
                Choose file
              </Button>
              <p className="mt-3 text-xs text-slate-500">
                Columns: word, type, part_of_speech, meaning, category, status, ipa (optional). Max {MAX_VOCABULARY_IMPORT_WORDS} words per import.
              </p>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800">Optional word images</p>
                <p className="mt-1 text-xs text-slate-500">Choose a folder of images named after each word, e.g. apple.jpg. We match by filename and upload only after you import.</p>
              </div>
              <Button variant="secondary" onClick={() => imageInputRef.current?.click()} disabled={isImporting}>
                <FileUp size={16} /> {imageFiles.length ? `${imageFiles.length} images selected` : "Choose image folder"}
              </Button>
            </div>

            {preview && (
              <div className="mt-5">
                <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
                  <Summary value={preview.totalRows} label="CSV rows" />
                  <Summary value={preview.items.length} label="Ready" />
                  <Summary value={preview.duplicates} label="Duplicates" />
                  <Summary value={preview.errors.length} label="Errors" />
                </div>

                {imageFiles.length > 0 && (
                  <div className="mt-3 rounded-xl bg-blue-50 px-3 py-2.5 text-xs text-blue-800">
                    {imageMatch.matched} image(s) match words and will be uploaded with this import.
                    {imageMatch.alreadyHasImage > 0 && ` ${imageMatch.alreadyHasImage} matching word(s) already have images and won't be overwritten.`}
                    {imageMatch.unmatched > 0 && ` ${imageMatch.unmatched} image(s) have no unique matching word.`}
                    {imageMatch.invalidCount > 0 && ` ${imageMatch.invalidCount} image(s) are unsupported or exceed 5 MB and will be skipped.`}
                  </div>
                )}

                {preview.categoryFallbacks > 0 && (
                  <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    {preview.categoryFallbacks} word(s) use an unknown category and will be moved to Uncategorized.
                  </p>
                )}

                {preview.errors.length > 0 && (
                  <div className="hide-scrollbar mt-3 max-h-32 overflow-y-auto rounded-lg bg-red-50 p-3 text-xs text-red-700">
                    <p className="font-semibold">Rows with errors</p>
                    <ul className="mt-1 list-inside list-disc space-y-1">
                      {preview.errors.slice(0, 10).map((issue, index) => (
                        <li key={`${issue.line}-${index}`}>
                          Row {issue.line}: {issue.message}
                        </li>
                      ))}
                    </ul>
                    {preview.errors.length > 10 && (
                      <p className="mt-1">
                        And {preview.errors.length - 10} more error(s).
                      </p>
                    )}
                  </div>
                )}

                {preview.items.length > 0 && (
                  <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[520px] text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="px-3 py-2 font-medium">Word</th>
                          <th className="px-3 py-2 font-medium">Meaning</th>
                          <th className="px-3 py-2 font-medium">Category</th>
                          <th className="px-3 py-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.items.slice(0, 8).map((item, index) => (
                          <tr key={`${item.word}-${index}`} className="border-t border-slate-100">
                            <td className="px-3 py-2 font-medium text-slate-900">{item.word}</td>
                            <td className="max-w-64 truncate px-3 py-2 text-slate-600">{item.meaning}</td>
                            <td className="px-3 py-2 text-slate-600">{item.category}</td>
                            <td className="px-3 py-2 capitalize text-slate-600">{item.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {preview.items.length > 8 && (
                      <p className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500">
                        Showing the first 8 of {preview.items.length} words.
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={() => void handleImport()}
                    disabled={isImporting || preview.items.length === 0}
                  >
                    {isImporting
                      ? "Importing..."
                      : `Import ${preview.items.length} words`}
                  </Button>
                </div>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

function Summary({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-2 py-3">
      <p className="text-lg font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

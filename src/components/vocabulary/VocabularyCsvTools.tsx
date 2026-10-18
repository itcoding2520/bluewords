"use client";

import { useRef, useState, type ChangeEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Download, FileUp, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { useVocabulary } from "@/contexts/VocabularyContext";
import type { VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import {
  exportVocabularyCsv,
  previewVocabularyCsvImport,
  type VocabularyCsvPreview,
} from "@/lib/vocabulary-csv";

interface VocabularyCsvToolsProps {
  words: VocabularyWord[];
  categories: VocabularyCategoryRow[];
}

export function VocabularyCsvTools({
  words,
  categories,
}: VocabularyCsvToolsProps) {
  const { importWords } = useVocabulary();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<VocabularyCsvPreview | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  function handleExport() {
    if (words.length === 0) {
      toast.info("There are no words to export yet.");
      return;
    }

    const blob = new Blob([exportVocabularyCsv(words)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "bluewords-vocabulary.csv";
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success(`Exported ${words.length} words.`);
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
          words.map((word) => word.word)
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

  async function handleImport() {
    if (!preview || preview.items.length === 0 || isImporting) return;

    setIsImporting(true);
    try {
      const result = await importWords(preview.items);
      const duplicateTotal = preview.duplicates + result.duplicates;

      if (result.imported > 0) {
        toast.success(`Imported ${result.imported} words.`);
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
      if (result.failed === 0) setOpen(false);
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setOpen(true)}>
          <FileUp size={16} />
          Import CSV
        </Button>
        <Button variant="secondary" onClick={handleExport}>
          <Download size={16} />
          Export CSV
        </Button>
      </div>

      <Dialog.Root
        open={open}
        onOpenChange={(nextOpen) => {
          if (!isReading && !isImporting) setOpen(nextOpen);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-24px)] w-[calc(100%-24px)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:max-h-[calc(100dvh-48px)] sm:p-6">
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
                Columns: word, type, part_of_speech, meaning, category, status
              </p>
            </div>

            {preview && (
              <div className="mt-5">
                <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
                  <Summary value={preview.totalRows} label="CSV rows" />
                  <Summary value={preview.items.length} label="Ready" />
                  <Summary value={preview.duplicates} label="Duplicates" />
                  <Summary value={preview.errors.length} label="Errors" />
                </div>

                {preview.categoryFallbacks > 0 && (
                  <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    {preview.categoryFallbacks} word(s) use an unknown category and will be moved to Uncategorized.
                  </p>
                )}

                {preview.errors.length > 0 && (
                  <div className="mt-3 max-h-32 overflow-y-auto rounded-lg bg-red-50 p-3 text-xs text-red-700">
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

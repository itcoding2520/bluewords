import * as Dialog from "@radix-ui/react-dialog";
import { FileUp, X } from "lucide-react";
import type { ChangeEvent, MutableRefObject } from "react";
import { Button } from "@/components/ui/Button";
import { MAX_VOCABULARY_IMPORT_WORDS, type VocabularyCsvPreview } from "@/lib/vocabulary-csv";
import { VocabularyCsvPreviewPanel } from "@/components/vocabulary/VocabularyCsvPreviewPanel";

interface VocabularyCsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileInputRef: MutableRefObject<HTMLInputElement | null>;
  imageInputRef: MutableRefObject<HTMLInputElement | null>;
  fileName: string;
  imageFiles: File[];
  preview: VocabularyCsvPreview | null;
  isReading: boolean;
  isImporting: boolean;
  imageMatch: {
    matched: number;
    alreadyHasImage: number;
    unmatched: number;
    invalidCount: number;
  };
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onImageFilesChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onImport: () => void;
}

export function VocabularyCsvImportDialog({
  open,
  onOpenChange,
  fileInputRef,
  imageInputRef,
  fileName,
  imageFiles,
  preview,
  isReading,
  isImporting,
  imageMatch,
  onFileChange,
  onImageFilesChange,
  onImport,
}: VocabularyCsvImportDialogProps) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isReading && !isImporting) onOpenChange(nextOpen);
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
            onChange={(event) => void onFileChange(event)}
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
            onChange={onImageFilesChange}
            className="sr-only"
          />

          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
            <p className="text-sm text-slate-600">
              {isReading ? "Reading CSV..." : fileName || "Choose a CSV file to preview its contents."}
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
              Columns: word, type, meaning, part_of_speech, detailed_meaning, category, status, ipa (optional). Max {MAX_VOCABULARY_IMPORT_WORDS} words per import. Older files without detailed_meaning are also supported.
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

          <VocabularyCsvPreviewPanel
            preview={preview}
            imageCount={imageFiles.length}
            imageMatch={imageMatch}
            isImporting={isImporting}
            onImport={onImport}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

import * as Dialog from "@radix-ui/react-dialog";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface VocabularyCsvExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: string;
  wordCount: number;
  isWordCountLoading: boolean;
  isExporting: boolean;
  onExport: () => void;
}

export function VocabularyCsvExportDialog({
  open,
  onOpenChange,
  category,
  wordCount,
  isWordCountLoading,
  isExporting,
  onExport,
}: VocabularyCsvExportDialogProps) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isExporting) onOpenChange(nextOpen);
      }}
    >
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
              <dd className="font-medium text-slate-900">{category}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Words</dt>
              <dd className="font-medium text-slate-900">
                {isWordCountLoading ? "Loading…" : wordCount}
              </dd>
            </div>
            {category === "All" && (
              <p className="text-xs text-slate-500">
                All is selected, so only words on the current page (including the active search) will be exported.
              </p>
            )}
          </dl>

          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isExporting}>
              Cancel
            </Button>
            <Button
              onClick={onExport}
              disabled={isExporting || isWordCountLoading || wordCount === 0}
            >
              <Download size={16} />
              {isExporting ? "Exporting..." : "Export"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

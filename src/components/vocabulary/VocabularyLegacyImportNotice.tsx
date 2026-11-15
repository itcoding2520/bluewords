import type { VocabularyImportPreview } from "@/lib/vocabulary-import";

interface VocabularyLegacyImportNoticeProps {
  importPreview: VocabularyImportPreview | null;
  isImporting: boolean;
  showImportPreview: boolean;
  onTogglePreview: () => void;
  onImport: () => void;
}

export function VocabularyLegacyImportNotice({
  importPreview,
  isImporting,
  showImportPreview,
  onTogglePreview,
  onImport,
}: VocabularyLegacyImportNoticeProps) {
  if (!importPreview) return null;

  return (
    <div className="my-6 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Have vocabulary from BlueWords v1.0?</h3>
          <p className="mt-1 text-xs text-slate-500">Import words saved in this browser to your account.</p>
        </div>
        <button
          type="button"
          onClick={onTogglePreview}
          disabled={isImporting}
          className="rounded-lg cursor-pointer border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50 disabled:opacity-50"
        >
          {showImportPreview ? "Hide preview" : "Preview import"}
        </button>
      </div>

      {showImportPreview && (
        <div className="mt-4 border-t border-blue-100 pt-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xl font-semibold text-slate-900">{importPreview.total}</p>
              <p className="text-xs text-slate-500">Old words</p>
            </div>
            <div>
              <p className="text-xl font-semibold text-slate-900">{importPreview.duplicates}</p>
              <p className="text-xs text-slate-500">Duplicates</p>
            </div>
            <div>
              <p className="text-xl font-semibold text-blue-700">{importPreview.ready.length}</p>
              <p className="text-xs text-slate-500">Ready to import</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">Your browser data will not be deleted.</p>
            <button
              type="button"
              onClick={onImport}
              disabled={isImporting || importPreview.ready.length === 0}
              className="rounded-lg cursor-pointer bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isImporting ? "Importing..." : `Import ${importPreview.ready.length} words`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

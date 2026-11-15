import { Button } from "@/components/ui/Button";
import type { VocabularyCsvPreview } from "@/lib/vocabulary-csv";

interface VocabularyCsvPreviewPanelProps {
  preview: VocabularyCsvPreview | null;
  imageCount: number;
  imageMatch: {
    matched: number;
    alreadyHasImage: number;
    unmatched: number;
    invalidCount: number;
  };
  isImporting: boolean;
  onImport: () => void;
}

export function VocabularyCsvPreviewPanel({
  preview,
  imageCount,
  imageMatch,
  isImporting,
  onImport,
}: VocabularyCsvPreviewPanelProps) {
  if (!preview) return null;

  return (
    <div className="mt-5">
      <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
        <Summary value={preview.totalRows} label="CSV rows" />
        <Summary value={preview.items.length} label="Ready" />
        <Summary value={preview.duplicates} label="Duplicates" />
        <Summary value={preview.errors.length} label="Errors" />
      </div>

      {imageCount > 0 && (
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
            <p className="mt-1">And {preview.errors.length - 10} more error(s).</p>
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
        <Button onClick={onImport} disabled={isImporting || preview.items.length === 0}>
          {isImporting ? "Importing..." : `Import ${preview.items.length} words`}
        </Button>
      </div>
    </div>
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

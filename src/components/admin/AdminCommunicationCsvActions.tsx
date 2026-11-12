"use client";

import { Download, FileUp, RefreshCw } from "lucide-react";

import type { createClient } from "@/lib/supabase/client";
import { useAdminCommunicationCsvActions } from "@/hooks/useAdminCommunicationCsvActions";

type SupabaseClient = ReturnType<typeof createClient>;

type Props = {
  supabase: SupabaseClient;
  selectedTopicId: string;
  busy: boolean;
  setBusy: React.Dispatch<React.SetStateAction<boolean>>;
  onRefresh: () => Promise<void>;
};

export function AdminCommunicationCsvActions({ supabase, selectedTopicId, busy, setBusy, onRefresh }: Props) {
  const { fileRef, importCsv, exportCsv } = useAdminCommunicationCsvActions({ supabase, selectedTopicId, setBusy, onRefresh });

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => void onRefresh()} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-sky-200 bg-white px-3 text-sm font-semibold text-blue-700">
        <RefreshCw size={16} /> Refresh
      </button>
      <button type="button" disabled={busy} onClick={() => fileRef.current?.click()} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-sky-200 bg-white px-3 text-sm font-semibold text-blue-700">
        <FileUp size={16} /> Import CSV
      </button>
      <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => void importCsv(event.target.files?.[0])} />
      <button type="button" title="Export the selected situation only" aria-label="Export selected situation CSV" disabled={busy || !selectedTopicId} onClick={() => void exportCsv()} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-600 px-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
        <Download size={16} /> Export situation
      </button>
    </div>
  );
}

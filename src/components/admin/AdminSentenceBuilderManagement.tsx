"use client";

import { useAdminSentenceBuilderController } from "@/hooks/useAdminSentenceBuilderController";
import { Download, FileUp, RefreshCw } from "lucide-react";
import { getPageRange } from "@/lib/pagination";
import { AdminSentenceBuilderEditorForm } from "@/components/admin/AdminSentenceBuilderEditorForm";
import { AdminSentenceBuilderQuestionBank } from "@/components/admin/AdminSentenceBuilderQuestionBank";

export function AdminSentenceBuilderManagement() {
  const {
    content: { filteredQuestions, loading, visible, categoryOptions },
    editor: { draft, setDraft, editing, busy },
    pagination: {
      filter, setFilter, pageSize, setPageSize, setPage, pageCount, currentPage,
    },
    csv: { fileRef, importCsv, exportCsv },
    actions: { refresh, editQuestion, cancelEdit, save, removeQuestion },
  } = useAdminSentenceBuilderController();
  const pageRange = getPageRange(filteredQuestions.length, currentPage, pageSize);

  return <main className="space-y-5">
    <header className="rounded-3xl border border-sky-100 bg-gradient-to-r from-white via-sky-50 to-cyan-100 p-5 sm:p-7">
      <p className="text-sm font-bold text-blue-600">Administration</p><div className="mt-1 flex flex-wrap items-end justify-between gap-4"><div><h1 className="page-title text-3xl">Sentence Builder data</h1><p className="page-intro-description mt-2">Manage sentence prompts and choose a difficulty for every question.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => void refresh()} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-sky-200 bg-white px-3 text-sm font-semibold text-blue-700"><RefreshCw size={16}/> Refresh</button><button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-sky-200 bg-white px-3 text-sm font-semibold text-blue-700"><FileUp size={16}/> Import CSV</button><input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => void importCsv(event.target.files?.[0])}/><button type="button" onClick={() => void exportCsv()} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-600 px-3 text-sm font-semibold text-white"><Download size={16}/> Export CSV</button></div></div>
    </header>

    <AdminSentenceBuilderEditorForm
      draft={draft}
      editing={editing}
      busy={busy}
      categoryOptions={categoryOptions}
      onDraftChange={setDraft}
      onSave={(event) => void save(event)}
      onCancel={cancelEdit}
    />

    <AdminSentenceBuilderQuestionBank
      filteredQuestions={filteredQuestions}
      visible={visible}
      loading={loading}
      filter={filter}
      pageSize={pageSize}
      currentPage={currentPage}
      pageCount={pageCount}
      pageRange={pageRange}
      onFilterChange={(nextFilter) => { setFilter(nextFilter); setPage(1); }}
      onPageSizeChange={(nextPageSize) => { setPageSize(nextPageSize); setPage(1); }}
      onPageChange={setPage}
      onEdit={editQuestion}
      onRemove={(question) => void removeQuestion(question)}
    />
  </main>;
}

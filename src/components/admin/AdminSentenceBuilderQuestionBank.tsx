import { Pencil, Trash2 } from "lucide-react";
import { Select } from "@/components/ui/Select";
import type { SentenceBuilderQuestion, SentenceDifficulty } from "@/lib/sentence-builder";

export function AdminSentenceBuilderQuestionBank({
  filteredQuestions,
  visible,
  loading,
  filter,
  pageSize,
  currentPage,
  pageCount,
  pageRange,
  onFilterChange,
  onPageSizeChange,
  onPageChange,
  onEdit,
  onRemove,
}: {
  filteredQuestions: SentenceBuilderQuestion[];
  visible: SentenceBuilderQuestion[];
  loading: boolean;
  filter: SentenceDifficulty | "all";
  pageSize: 50 | 100;
  currentPage: number;
  pageCount: number;
  pageRange: { first: number; last: number };
  onFilterChange: (filter: SentenceDifficulty | "all") => void;
  onPageSizeChange: (size: 50 | 100) => void;
  onPageChange: (page: number) => void;
  onEdit: (question: SentenceBuilderQuestion) => void;
  onRemove: (question: SentenceBuilderQuestion) => void;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Question bank <span className="text-sm text-slate-500">({filteredQuestions.length})</span></h2>
          <p className="mt-1 text-sm text-slate-500">Source level 1/2/3 maps to Easy/Medium/Hard when importing the sample CSV.</p>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <Select aria-label="Filter by difficulty" containerClassName="w-full sm:w-40" className="!h-[2.65rem] !rounded-xl !border-slate-200 !px-3 !text-sm" value={filter} onChange={(event) => onFilterChange(event.target.value as SentenceDifficulty | "all")}>
            <option value="all">All levels</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
          </Select>
          <Select aria-label="Questions per page" containerClassName="w-full sm:w-32" className="!h-[2.65rem] !rounded-xl !border-slate-200 !px-3 !text-sm" value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value) as 50 | 100)}>
            <option value={50}>50 / page</option><option value={100}>100 / page</option>
          </Select>
        </div>
      </div>
      {loading ? (
        <p className="p-8 text-center text-sm text-slate-500">Loading questions…</p>
      ) : visible.length === 0 ? (
        <p className="p-8 text-center text-sm text-slate-500">No questions found.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {visible.map((question) => (
            <article key={question.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-sm text-slate-900">{question.question_id} · {question.answer_sentence}</strong>
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold capitalize text-blue-700">{question.difficulty}</span>
                  {!question.is_active && <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">Inactive</span>}
                </div>
                <p className="mt-1 truncate text-sm text-slate-500">{question.prompt_vi} · {question.category}</p>
              </div>
              <button type="button" onClick={() => onEdit(question)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-blue-200 px-3 text-sm font-semibold text-blue-700"><Pencil size={15}/> Edit</button>
              <button type="button" onClick={() => onRemove(question)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-rose-200 px-3 text-sm font-semibold text-rose-700"><Trash2 size={15}/> Remove</button>
            </article>
          ))}
        </div>
      )}
      {!loading && filteredQuestions.length > 0 && (
        <footer className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm text-slate-500">
          <span>Showing {pageRange.first}–{pageRange.last} of {filteredQuestions.length} questions</span>
          <div className="flex items-center gap-3">
            <span>Page {currentPage} of {pageCount}</span>
            <button type="button" aria-label="Previous page" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)} className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40">‹</button>
            <button type="button" aria-label="Next page" disabled={currentPage >= pageCount} onClick={() => onPageChange(currentPage + 1)} className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40">›</button>
          </div>
        </footer>
      )}
    </section>
  );
}

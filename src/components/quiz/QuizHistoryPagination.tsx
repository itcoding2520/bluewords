"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { RowsPerPageSelect } from "@/components/ui/RowsPerPageSelect";
import { getNextPage, getPageCount, getPageRange, getPreviousPage } from "@/lib/pagination";

export function QuizHistoryPagination({
  total,
  page,
  pageSize,
  onPageSizeChange,
  onPageChange,
}: {
  total: number;
  page: number;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  onPageChange: (page: number) => void;
}) {
  const pageCount = getPageCount(total, pageSize);
  const pageRange = getPageRange(total, page, pageSize);

  return (
    <div className="quiz-history-pagination mt-5 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <p aria-live="polite">Showing {pageRange.first}–{pageRange.last} of {total} attempts</p>
      <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
        <RowsPerPageSelect
          ariaLabel="Quiz history rows per page"
          value={pageSize}
          onChange={onPageSizeChange}
        />
        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap">Page {page} of {pageCount}</span>
          <Button variant="secondary" aria-label="Previous quiz history page" onClick={() => onPageChange(getPreviousPage(page))} disabled={page <= 1} className="size-10 px-0"><ChevronLeft size={17} /></Button>
          <Button variant="secondary" aria-label="Next quiz history page" onClick={() => onPageChange(getNextPage(page, pageCount))} disabled={page >= pageCount} className="size-10 px-0"><ChevronRight size={17} /></Button>
        </div>
      </div>
    </div>
  );
}

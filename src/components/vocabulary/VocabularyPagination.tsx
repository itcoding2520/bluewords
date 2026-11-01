"use client";

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

type VocabularyPaginationProps = {
  first: number;
  last: number;
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  onPrevious: () => void;
  onNext: () => void;
};

export function VocabularyPagination({
  first,
  last,
  total,
  page,
  pageCount,
  pageSize,
  onPageSizeChange,
  onPrevious,
  onNext,
}: VocabularyPaginationProps) {
  return (
    <div className="mt-4 flex flex-col gap-3 px-1 text-sm text-slate-500 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <p aria-live="polite" className="shrink-0">
        Showing {first}–{last} of {total} words
      </p>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 sm:justify-end">
        <label className="flex items-center gap-2 whitespace-nowrap">
          <span className="relative inline-flex">
            <select
              aria-label="Rows per page"
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="h-10 w-[76px] cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
            >
              {[10, 20, 50].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500">
              <ChevronDown size={15} />
            </span>
          </span>
        </label>

        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap">Page {page} of {pageCount}</span>
          <Button
            variant="secondary"
            aria-label="Previous page"
            onClick={onPrevious}
            disabled={page <= 1}
            className="size-10 px-0"
          >
            <ChevronLeft size={17} />
          </Button>
          <Button
            variant="secondary"
            aria-label="Next page"
            onClick={onNext}
            disabled={page >= pageCount}
            className="size-10 px-0"
          >
            <ChevronRight size={17} />
          </Button>
        </div>
      </div>
    </div>
  );
}

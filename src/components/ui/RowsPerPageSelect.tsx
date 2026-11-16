"use client";

import { ChevronDown } from "lucide-react";

export function RowsPerPageSelect({
  value,
  ariaLabel,
  onChange,
}: {
  value: number;
  ariaLabel: string;
  onChange: (size: number) => void;
}) {
  return (
    <label className="flex items-center gap-2 whitespace-nowrap">
      <span className="relative inline-flex">
        <select
          aria-label={ariaLabel}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-10 w-[76px] cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
        >
          {[10, 20, 50].map((size) => <option key={size} value={size}>{size}</option>)}
        </select>
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500">
          <ChevronDown size={15} />
        </span>
      </span>
    </label>
  );
}
